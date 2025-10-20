from datetime import datetime
from io import BytesIO
import uuid

from fastapi import HTTPException, UploadFile
from fastapi.params import Depends
import pandas as pd
from sqlalchemy import or_, text

from app.core.database import Session, get_db
from app.utils.deps import DB
from app.utils.response import APIResponse
from app.models.temp_import import TempImport

class ImportLapPembelianService:
    def __init__(self, db = Depends(get_db)):
        self.db = db
        
    def _serialize_for_json(self, data):
        """Convert datetime and other non-serializable types to JSON-compatible formats"""
        if isinstance(data, dict):
            return {k: self._serialize_for_json(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._serialize_for_json(item) for item in data]
        elif isinstance(data, datetime):
            return data.isoformat()
        elif pd.isna(data):
            return None
        elif isinstance(data, (pd.Timestamp, pd.Timedelta)):
            return str(data)
        else:
            return data

    def _safe_float(self, value, default=0.0):
        """Safely convert value to float, return default if invalid"""
        if pd.isna(value):
            return default
        try:
            return float(value)
        except (ValueError, TypeError):
            return default
    
    def _safe_str(self, value):
        """Safely convert value to string"""
        if pd.isna(value):
            return ""
        return str(value).strip()

    def upload_excel(self, file: UploadFile):
        try:
            contents = file.file.read()
            wb = pd.ExcelFile(BytesIO(contents))
        except Exception:
            return APIResponse.not_found(message=f"Invalid Excel file.")

        session_id = uuid.uuid4()
        summary = {"session_id": str(session_id), "sheets": {}}
        
        try:
            for sheet in wb.sheet_names:
                df = pd.read_excel(wb, sheet_name=sheet, header=6)
                df = df.iloc[:, :-2]  # Drop 2 kolom terakhir (junk cols)
                
                valid_rows, preview_rows = 0, []

                for idx, row in df.iterrows():
                    # Ambil semua data yang diperlukan
                    acc_no = row.get("NO.ACC")
                    acc_name = row.get("ACCOUNT")
                    nama_barang = self._safe_str(row.get("NAMA BARANG"))
                    satuan = self._safe_str(row.get("SATUAN")).upper()
                    kode_supplier = self._safe_str(row.get("KODE SUPPLIER")).upper()
                    nama_supplier = self._safe_str(row.get("SUPPLIER"))
                    
                    # Ambil data transaksi (jika ada)
                    qty = self._safe_float(row.get("QTY"), 0)
                    harga = self._safe_float(row.get("HARGA SAT"), 0)
                    no_bukti = self._safe_str(row.get("NO.BUKTI"))
                    no_po = self._safe_str(row.get("NO.PO"))
                    tanggal = row.get("TANGGAL")
                    
                    # Ambil data pajak dan lainnya
                    ppn = self._safe_float(row.get("PPN"), 0.0)
                    dpp = self._safe_float(row.get("DPP"), 0.0)
                    pph = self._safe_float(row.get("PPH"), 0.0)
                    pot = self._safe_float(row.get("POT."), 0.0)  # discount
                    faktur_pajak = self._safe_str(row.get("FAKTUR PAJAK"))
                    kurs = self._safe_float(row.get("KURS"), 0.0)  # exchange_rate

                    # Convert tanggal
                    if pd.notna(tanggal):
                        if isinstance(tanggal, (pd.Timestamp, datetime)):
                            tanggal = tanggal.strftime("%Y-%m-%d")
                        else:
                            tanggal = self._safe_str(tanggal)
                    else:
                        tanggal = None

                    # Skip row yang benar-benar kosong
                    if not any([acc_no, acc_name, nama_barang, kode_supplier, nama_supplier]):
                        continue

                    # 1️⃣ ACCOUNT - Jika ada NO.ACC dan ACCOUNT
                    if pd.notna(acc_no) and pd.notna(acc_name):
                        missing = []
                        if not pd.notna(acc_no):
                            missing.append("NO.ACC")
                        if not pd.notna(acc_name):
                            missing.append("ACCOUNT")
                        
                        status = "valid" if not missing else "skipped"
                        reason = None if not missing else f"missing: {', '.join(missing)}"
                        
                        parsed = {
                            "account_no": int(acc_no) if pd.notna(acc_no) else None,
                            "name": self._safe_str(acc_name)
                        }
                        
                        temp_data = TempImport(
                            session_id=session_id,
                            sheet_name=sheet,
                            table_target="account",
                            row_number=idx + 7 + 1,
                            raw_data=self._serialize_for_json(row.to_dict()),
                            parsed_data=parsed,
                            status=status,
                            reason=reason
                        )
                        self.db.add(temp_data)
                        
                        if status == "valid":
                            valid_rows += 1

                    # 2️⃣ PRODUCT - Jika ada NAMA BARANG
                    if nama_barang:
                        missing = []
                        if not nama_barang:
                            missing.append("NAMA BARANG")
                        if not satuan:
                            missing.append("SATUAN")
                        if not pd.notna(acc_no):
                            missing.append("NO.ACC")
                        
                        status = "valid" if not missing else "skipped"
                        reason = None if not missing else f"missing: {', '.join(missing)}"
                        
                        parsed = {
                            "name": nama_barang or None,
                            "unit": satuan or None,
                            "account_no": int(acc_no) if pd.notna(acc_no) else None
                        }
                        
                        temp_data = TempImport(
                            session_id=session_id,
                            sheet_name=sheet,
                            table_target="product",
                            row_number=idx + 7 + 1,
                            raw_data=self._serialize_for_json(row.to_dict()),
                            parsed_data=parsed,
                            status=status,
                            reason=reason
                        )
                        self.db.add(temp_data)
                        
                        if status == "valid":
                            valid_rows += 1

                    # 3️⃣ SUPPLIER - Jika ada KODE SUPPLIER dan SUPPLIER
                    if kode_supplier and nama_supplier:
                        missing = []
                        if not kode_supplier:
                            missing.append("KODE SUPPLIER")
                        if not nama_supplier:
                            missing.append("SUPPLIER")
                        
                        status = "valid" if not missing else "skipped"
                        reason = None if not missing else f"missing: {', '.join(missing)}"
                        
                        parsed = {
                            "code": kode_supplier or None,
                            "name": nama_supplier or None
                        }
                        
                        temp_data = TempImport(
                            session_id=session_id,
                            sheet_name=sheet,
                            table_target="supplier",
                            row_number=idx + 7 + 1,
                            raw_data=self._serialize_for_json(row.to_dict()),
                            parsed_data=parsed,
                            status=status,
                            reason=reason
                        )
                        self.db.add(temp_data)
                        
                        if status == "valid":
                            valid_rows += 1

                    # 4️⃣ PURCHASING - Validasi lebih ketat
                    if nama_barang:
                        # Normalisasi product name
                        product_name_normalized = nama_barang.upper().strip()
                        
                        # Skip jika product name invalid
                        if product_name_normalized in {"NAT", "NONE", "TOTAL", "JUMLAH", "GRAND TOTAL"}:
                            continue
                        
                        # Validasi required fields untuk purchasing
                        missing = []
                        if not kode_supplier:
                            missing.append("KODE SUPPLIER")
                        if not tanggal and not no_bukti:
                            missing.append("TANGGAL/NO.BUKTI")
                        
                        status = "valid" if not missing else "skipped"
                        reason = None if not missing else f"missing column(s): {', '.join(missing)}"
                        
                        parsed = {
                            "supplier_code": kode_supplier or None,
                            "product_name": product_name_normalized,
                            "qty": qty,
                            "price": harga,
                            "discount": pot,
                            "ppn": ppn,
                            "dpp": dpp,
                            "pph": pph,
                            "tax_no": faktur_pajak or None,
                            "exchange_rate": kurs,
                            "tanggal": tanggal,
                            "no_bukti": no_bukti or None,
                            "no_po": no_po or None
                        }
                        
                        temp_data = TempImport(
                            session_id=session_id,
                            sheet_name=sheet,
                            table_target="purchasing",
                            row_number=idx + 7 + 1,
                            raw_data=self._serialize_for_json(row.to_dict()),
                            parsed_data=parsed,
                            status=status,
                            reason=reason
                        )
                        self.db.add(temp_data)
                        
                        if status == "valid":
                            valid_rows += 1
                            
                    # Preview hanya untuk purchasing
                    if len(preview_rows) < 30 and kode_supplier and nama_barang:
                        preview_rows.append({
                            "supplier": kode_supplier or None,
                            "product": nama_barang or None,
                            "qty": qty,
                            "price": harga,
                            "dpp": dpp,
                            "ppn": ppn,
                        })

                summary["sheets"][sheet] = {
                    "valid_rows": valid_rows,
                    "preview_rows": preview_rows
                }
                
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return APIResponse.internal_error(message=f"Failed to process Excel file: {str(e)}")
        
        return APIResponse.ok(data=summary)

    def commit_data(self, session_id: str):
        try:
            # 1️⃣ Import Account
            insert_accounts = text("""
                INSERT INTO accounts (account_no, name, account_type)
                SELECT 
                    (parsed_data->>'account_no')::int,
                    parsed_data->>'name',
                    'Goods'
                FROM temp_import
                WHERE session_id = :sid 
                AND status = 'valid' 
                AND table_target = 'account'
                AND NOT EXISTS (
                    SELECT 1 FROM accounts a WHERE a.account_no = (parsed_data->>'account_no')::int
                )
            """)
            
            # 2️⃣ Import Supplier
            insert_suppliers = text("""
                INSERT INTO suppliers (code, name)
                SELECT 
                    parsed_data->>'code',
                    parsed_data->>'name'
                FROM temp_import
                WHERE session_id = :sid 
                AND status = 'valid' 
                AND table_target = 'supplier'
                AND NOT EXISTS (
                    SELECT 1 FROM suppliers s WHERE s.code = parsed_data->>'code'
                )
            """)

            # 3️⃣ Import Product
            insert_products = text("""
                INSERT INTO products (name, unit, account_id)
                SELECT 
                    parsed_data->>'name',
                    parsed_data->>'unit',
                    a.id
                FROM temp_import ti
                LEFT JOIN accounts a ON a.account_no = (ti.parsed_data->>'account_no')::int
                WHERE ti.session_id = :sid 
                AND ti.status = 'valid' 
                AND ti.table_target = 'product'
                AND a.id IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM products p WHERE UPPER(p.name) = UPPER(ti.parsed_data->>'name')
                )
            """)

            # 4️⃣ Import Purchasing Header
            # Group by (no_bukti OR tanggal, supplier_code)
            insert_purchasing_header = text("""
                INSERT INTO purchasings (date, code, purchase_order, supplier_id)
                SELECT DISTINCT
                    (ti.parsed_data->>'tanggal')::date,
                    ti.parsed_data->>'no_bukti',
                    ti.parsed_data->>'no_po',
                    s.id
                FROM temp_import ti
                JOIN suppliers s ON s.code = ti.parsed_data->>'supplier_code'
                WHERE ti.session_id = :sid 
                AND ti.status = 'valid' 
                AND ti.table_target = 'purchasing'
                AND NOT EXISTS (
                    SELECT 1 FROM purchasings p 
                    WHERE p.supplier_id = s.id
                    AND (
                        (ti.parsed_data->>'no_bukti' IS NOT NULL AND p.code = ti.parsed_data->>'no_bukti')
                        OR 
                        (ti.parsed_data->>'no_bukti' IS NULL AND p.date = (ti.parsed_data->>'tanggal')::date)
                    )
                )
                ON CONFLICT DO NOTHING
            """)

            # 5️⃣ Import Purchasing Details
            insert_purchasing_details = text("""
                INSERT INTO purchasing_details (
                    quantity, 
                    price, 
                    discount,
                    ppn,
                    pph,
                    dpp,
                    tax_no,
                    exchange_rate,
                    product_id, 
                    purchasing_id
                )
                SELECT 
                    (ti.parsed_data->>'qty')::numeric,
                    (ti.parsed_data->>'price')::numeric,
                    (ti.parsed_data->>'discount')::numeric,
                    (ti.parsed_data->>'ppn')::numeric,
                    (ti.parsed_data->>'pph')::numeric,
                    (ti.parsed_data->>'dpp')::numeric,
                    ti.parsed_data->>'tax_no',
                    (ti.parsed_data->>'exchange_rate')::numeric,
                    pr.id,
                    pu.id
                FROM temp_import ti
                JOIN suppliers s ON s.code = ti.parsed_data->>'supplier_code'
                JOIN products pr ON UPPER(pr.name) = UPPER(ti.parsed_data->>'product_name')
                JOIN purchasings pu ON pu.supplier_id = s.id
                    AND (
                        (ti.parsed_data->>'no_bukti' IS NOT NULL AND pu.code = ti.parsed_data->>'no_bukti')
                        OR
                        (ti.parsed_data->>'no_bukti' IS NULL AND pu.date = (ti.parsed_data->>'tanggal')::date)
                    )
                WHERE ti.session_id = :sid 
                AND ti.status = 'valid' 
                AND ti.table_target = 'purchasing'
            """)
            
            # Execute in order
            self.db.execute(insert_accounts, {"sid": session_id})
            self.db.execute(insert_suppliers, {"sid": session_id})
            self.db.execute(insert_products, {"sid": session_id})
            self.db.execute(insert_purchasing_header, {"sid": session_id})
            self.db.execute(insert_purchasing_details, {"sid": session_id})
            
            self.db.commit()
            
            # Get summary
            summary = self._get_import_summary(session_id)
            
            return APIResponse.created(
                message="Import success", 
                data={
                    "session_id": session_id,
                    "summary": summary
                }
            )
            
        except Exception as e:
            self.db.rollback()
            import traceback
            print(traceback.format_exc())
            return APIResponse.internal_error(message=f"Import failed: {str(e)}")

    def get_preview(self, session_id: str, table_target: str, page: int = 1, per_page: int = 50):
        """Get preview data by session_id and table_target with pagination"""
        
        # Validate table_target
        valid_targets = ["account", "supplier", "product", "purchasing"]
        if table_target not in valid_targets:
            return APIResponse.bad_request(
                message=f"Invalid table_target. Must be one of: {', '.join(valid_targets)}"
            )
        
        try:
            # Calculate offset
            offset = (page - 1) * per_page
            
            # Query untuk mengambil data preview
            query = text("""
                SELECT 
                    id,
                    sheet_name,
                    row_number,
                    parsed_data,
                    status,
                    reason,
                    created_at
                FROM temp_import
                WHERE session_id = :sid
                AND table_target = :target
                ORDER BY row_number ASC
                LIMIT :limit OFFSET :offset
            """)
            
            # Query untuk total count
            count_query = text("""
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'valid' THEN 1 END) as valid_count,
                    COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped_count
                FROM temp_import
                WHERE session_id = :sid
                AND table_target = :target
            """)
            
            # Execute queries
            results = self.db.execute(
                query, 
                {"sid": session_id, "target": table_target, "limit": per_page, "offset": offset}
            ).fetchall()
            
            count_result = self.db.execute(
                count_query,
                {"sid": session_id, "target": table_target}
            ).fetchone()
            
            # Format results
            preview_data = []
            for row in results:
                preview_data.append({
                    "id": row[0],
                    "sheet_name": row[1],
                    "row_number": row[2],
                    "data": row[3],  # parsed_data (JSON)
                    "status": row[4],
                    "reason": row[5],
                    "created_at": row[6].isoformat() if row[6] else None
                })
            
            total = count_result[0] if count_result else 0
            valid_count = count_result[1] if count_result else 0
            skipped_count = count_result[2] if count_result else 0
            
            total_pages = (total + per_page - 1) // per_page  # Ceiling division
            
            return APIResponse.ok(data={
                "session_id": session_id,
                "table_target": table_target,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "total_pages": total_pages,
                    "has_next": page < total_pages,
                    "has_prev": page > 1
                },
                "summary": {
                    "total": total,
                    "valid": valid_count,
                    "skipped": skipped_count
                },
                "data": preview_data
            })
            
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return APIResponse.internal_error(message=f"Failed to get preview: {str(e)}")

    def get_preview_summary(self, session_id: str):
        """Get summary of all table_targets for a session"""
        try:
            summary_query = text("""
                SELECT 
                    table_target,
                    status,
                    COUNT(*) as count
                FROM temp_import
                WHERE session_id = :sid
                GROUP BY table_target, status
                ORDER BY table_target, status
            """)
            
            results = self.db.execute(summary_query, {"sid": session_id}).fetchall()
            
            summary = {}
            for row in results:
                table = row[0]
                status = row[1]
                count = row[2]
                
                if table not in summary:
                    summary[table] = {"valid": 0, "skipped": 0, "total": 0}
                
                summary[table][status] = count
                summary[table]["total"] = summary[table].get("valid", 0) + summary[table].get("skipped", 0)
            
            return APIResponse.ok(data={
                "session_id": session_id,
                "summary": summary
            })
            
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return APIResponse.internal_error(message=f"Failed to get summary: {str(e)}")

    def _get_import_summary(self, session_id: str):
        """Get import summary statistics"""
        summary_query = text("""
            SELECT 
                table_target,
                status,
                COUNT(*) as count
            FROM temp_import
            WHERE session_id = :sid
            GROUP BY table_target, status
            ORDER BY table_target, status
        """)
        
        results = self.db.execute(summary_query, {"sid": session_id}).fetchall()
        
        summary = {}
        for row in results:
            table = row[0]
            status = row[1]
            count = row[2]
            
            if table not in summary:
                summary[table] = {"valid": 0, "skipped": 0}
            
            summary[table][status] = count
        
        return summary