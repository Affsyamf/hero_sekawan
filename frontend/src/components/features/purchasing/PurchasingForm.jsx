import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  Calendar,
  FileText,
  Building2,
  Plus,
  Trash2,
  Package,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Form from "../../ui/form/Form";
import Input from "../../ui/input/Input";
import Button from "../../ui/button/Button";
import { useTemp } from "../../../hooks/useTemp";
import { formatCurrency } from "../../../utils/helpers";

export default function PurchasingForm({
  purchasing = null,
  isOpen,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    code: "",
    date: new Date().toISOString().split("T")[0],
    purchase_order: "",
    supplier_id: "",
  });
  const [details, setDetails] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { value: suppliersInTemp = [] } = useTemp("suppliers:working-list", []);
  const { value: productsInTemp = [] } = useTemp("products:working-list", []);

  // Memoized options - hanya di-generate ulang jika data berubah
  const supplierOptions = useMemo(() => {
    return suppliersInTemp.map((x) => ({
      id: x.id,
      name: x.name,
      code: x.code || `SUP-${x.id}`,
    }));
  }, [suppliersInTemp]);

  const productOptions = useMemo(() => {
    return productsInTemp.map((x) => ({
      id: x.id,
      name: x.name,
      code: x.code,
      price: x.price || 0,
    }));
  }, [productsInTemp]);

  // Initialize form saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      
      if (purchasing) {
        // Edit mode
        setFormData({
          code: purchasing.code || "",
          date:
            purchasing.date?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          purchase_order: purchasing.purchase_order || "",
          supplier_id: purchasing.supplier_id || "",
        });
        setDetails(purchasing.details || []);
      } else {
        // Create mode
        setFormData({
          code: "",
          date: new Date().toISOString().split("T")[0],
          purchase_order: "",
          supplier_id: "",
        });
        setDetails([]);
      }
    }
  }, [isOpen, purchasing]);

  // Form input handler
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Detail handlers - Child mengelola detail items sendiri
  const handleAddDetail = () => {
    setDetails((prev) => [
      ...prev,
      {
        id: Date.now(),
        product_id: "",
        quantity: 0,
        price: 0,
        discount: 0,
        ppn: 0,
        dpp: 0,
        tax_no: "",
        exchange_rate: 1,
        subtotal: 0,
      },
    ]);
  };

  const handleRemoveDetail = (detailId) => {
    setDetails((prev) => prev.filter((detail) => detail.id !== detailId));
  };

  // Calculation logic - Child menghitung subtotal sendiri
  const calculateDetailSubtotal = (detail, field, value) => {
    const qty =
      field === "quantity"
        ? parseFloat(value) || 0
        : parseFloat(detail.quantity) || 0;
    const price =
      field === "price"
        ? parseFloat(value) || 0
        : parseFloat(detail.price) || 0;
    const discount =
      field === "discount"
        ? parseFloat(value) || 0
        : parseFloat(detail.discount) || 0;
    const ppn =
      field === "ppn" ? parseFloat(value) || 0 : parseFloat(detail.ppn) || 0;
    const rate =
      field === "exchange_rate"
        ? parseFloat(value) || 1
        : parseFloat(detail.exchange_rate) || 1;

    const baseAmount = qty * price;
    const dpp = baseAmount - discount;
    const subtotal = (dpp + ppn) * rate;

    return { dpp, subtotal };
  };

  const handleUpdateDetail = (detailId, field, value) => {
    setDetails((prev) =>
      prev.map((detail) => {
        if (detail.id === detailId) {
          const updated = { ...detail, [field]: value };

          // Auto-fill price saat product dipilih
          if (field === "product_id" && value) {
            const product = productOptions.find(
              (p) => p.id === parseInt(value)
            );
            if (product) {
              updated.price = product.price;
            }
          }

          // Recalculate jika field yang affect calculation
          if (
            ["quantity", "price", "discount", "ppn", "exchange_rate"].includes(
              field
            )
          ) {
            const { dpp, subtotal } = calculateDetailSubtotal(
              detail,
              field,
              value
            );
            updated.dpp = dpp;
            updated.subtotal = subtotal;
          }

          return updated;
        }
        return detail;
      })
    );
  };

  // Summary calculations - Child hitung summary sendiri
  const summary = useMemo(() => {
    const totalItems = details.length;
    const totalDPP = details.reduce((sum, d) => sum + (d.dpp || 0), 0);
    const totalPPN = details.reduce((sum, d) => sum + (d.ppn || 0), 0);
    const grandTotal = details.reduce((sum, d) => sum + (d.subtotal || 0), 0);

    return { totalItems, totalDPP, totalPPN, grandTotal };
  }, [details]);

  // Validation - Child validate sendiri
  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "No Bukti is required";
    }

    if (!formData.date.trim()) {
      newErrors.date = "Date is required";
    }

    if (!formData.supplier_id) {
      newErrors.supplier_id = "Supplier is required";
    }

    if (details.length === 0) {
      newErrors.details = "At least one product detail is required";
    }

    details.forEach((detail, index) => {
      if (!detail.product_id) {
        newErrors[`detail_product_${index}`] = "Product is required";
      }
      if (!detail.quantity || detail.quantity <= 0) {
        newErrors[`detail_quantity_${index}`] = "Valid quantity is required";
      }
      if (!detail.price || detail.price <= 0) {
        newErrors[`detail_price_${index}`] = "Valid price is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler - Child handle submit sendiri
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Pass data ke parent untuk disimpan
      await onSave({ ...formData, details, id: purchasing?.id });
    } catch (error) {
      console.error("Error saving purchasing:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reusable input class generator
  const inputClassName = (field) => `
    w-full px-3 py-2 rounded-lg border transition-all duration-200 
    bg-surface text-primary-text placeholder-secondary-text text-sm
    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
    hover:border-primary/40
    ${
      errors[field]
        ? "border-danger focus:ring-danger/20 focus:border-danger"
        : "border-default"
    }
  `;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={purchasing ? "Edit Purchasing" : "New Purchasing"}
      subtitle="Record product purchases from suppliers"
      size="xl"
      showFullscreenToggle={true}
      actions={
        <>
          <Button
            label="Cancel"
            onClick={onClose}
            disabled={loading}
            className="bg-transparent border border-default text-secondary-text hover:bg-background hover:text-primary-text"
          />
          <Button
            icon={ShoppingCart}
            label={loading ? "Saving..." : "Save Purchasing"}
            onClick={handleSubmit}
            disabled={loading}
          />
        </>
      }
    >
      <div className="space-y-5">
        {/* Main Information */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Group>
            <Form.Label htmlFor="code" required>
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                No Bukti
              </div>
            </Form.Label>
            <Input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value)}
              placeholder="Enter document number"
              error={!!errors.code}
            />
            <Form.Error>{errors.code}</Form.Error>
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="date" required>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Date
              </div>
            </Form.Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              error={!!errors.date}
            />
            <Form.Error>{errors.date}</Form.Error>
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="purchase_order">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                PO Number
              </div>
            </Form.Label>
            <Input
              id="purchase_order"
              type="text"
              value={formData.purchase_order}
              onChange={(e) =>
                handleInputChange("purchase_order", e.target.value)
              }
              placeholder="Enter PO number (optional)"
            />
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="supplier_id" required>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Supplier
              </div>
            </Form.Label>
            <select
              id="supplier_id"
              value={formData.supplier_id}
              onChange={(e) => handleInputChange("supplier_id", e.target.value)}
              className={inputClassName("supplier_id")}
            >
              <option value="">Select Supplier</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.code} - {supplier.name}
                </option>
              ))}
            </select>
            <Form.Error>{errors.supplier_id}</Form.Error>
          </Form.Group>
        </div>

        {/* Product Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-primary-text">
              <Package className="w-4 h-4 text-primary" />
              Product Details
            </h3>
            <Button icon={Plus} label="Add Product" onClick={handleAddDetail} />
          </div>

          {errors.details && (
            <p className="flex items-center text-xs text-danger">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.details}
            </p>
          )}

          <div className="overflow-x-auto border rounded-lg border-default">
            <table className="w-full text-sm">
              <thead className="border-b bg-background/50 border-default">
                <tr>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    Product
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    Qty
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    Price
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    Discount
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    DPP
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    PPN
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    Tax No
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    Rate
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    Subtotal
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-center uppercase text-secondary-text">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {details.map((detail, index) => (
                  <tr
                    key={detail.id}
                    className="transition-colors duration-150 hover:bg-background/30"
                  >
                    <td className="p-3">
                      <select
                        value={detail.product_id}
                        onChange={(e) =>
                          handleUpdateDetail(
                            detail.id,
                            "product_id",
                            e.target.value
                          )
                        }
                        className={`w-full px-2 py-1.5 text-xs rounded border transition-all duration-200 bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary hover:border-primary/40 ${
                          errors[`detail_product_${index}`]
                            ? "border-danger focus:ring-danger/20 focus:border-danger"
                            : "border-default"
                        }`}
                      >
                        <option value="">Select Product</option>
                        {productOptions.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.code} - {product.name}
                          </option>
                        ))}
                      </select>
                      {errors[`detail_product_${index}`] && (
                        <p className="mt-1 text-xs text-danger">
                          {errors[`detail_product_${index}`]}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        size="sm"
                        value={detail.quantity}
                        onChange={(e) =>
                          handleUpdateDetail(
                            detail.id,
                            "quantity",
                            e.target.value
                          )
                        }
                        placeholder="Qty"
                        error={!!errors[`detail_quantity_${index}`]}
                      />
                      {errors[`detail_quantity_${index}`] && (
                        <p className="mt-1 text-xs text-danger">
                          {errors[`detail_quantity_${index}`]}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        size="sm"
                        value={detail.price}
                        onChange={(e) =>
                          handleUpdateDetail(detail.id, "price", e.target.value)
                        }
                        placeholder="Price"
                        error={!!errors[`detail_price_${index}`]}
                      />
                      {errors[`detail_price_${index}`] && (
                        <p className="mt-1 text-xs text-danger">
                          {errors[`detail_price_${index}`]}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        size="sm"
                        value={detail.discount}
                        onChange={(e) =>
                          handleUpdateDetail(
                            detail.id,
                            "discount",
                            e.target.value
                          )
                        }
                        placeholder="Discount"
                      />
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium text-primary-text">
                        {formatCurrency(detail.dpp)}
                      </div>
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        size="sm"
                        value={detail.ppn}
                        onChange={(e) =>
                          handleUpdateDetail(detail.id, "ppn", e.target.value)
                        }
                        placeholder="PPN"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="text"
                        size="sm"
                        value={detail.tax_no}
                        onChange={(e) =>
                          handleUpdateDetail(
                            detail.id,
                            "tax_no",
                            e.target.value
                          )
                        }
                        placeholder="Tax No"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        size="sm"
                        value={detail.exchange_rate}
                        onChange={(e) =>
                          handleUpdateDetail(
                            detail.id,
                            "exchange_rate",
                            e.target.value
                          )
                        }
                        placeholder="Rate"
                      />
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium text-primary">
                        {formatCurrency(detail.subtotal)}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRemoveDetail(detail.id)}
                        className="p-1.5 text-danger hover:bg-danger/10 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-danger/20"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {details.length === 0 && (
                  <tr>
                    <td
                      colSpan="10"
                      className="p-8 text-center text-secondary-text"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-8 h-8 text-secondary-text/50" />
                        <p className="text-sm">No products added yet</p>
                        <p className="text-xs">Click "Add Product" to start</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        {details.length > 0 && (
          <div className="p-3 border rounded-lg bg-primary/10 border-primary/20">
            <h4 className="flex items-center gap-2 mb-2 text-sm font-medium text-primary">
              <DollarSign className="w-3.5 h-3.5" />
              Purchasing Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
              <div>
                <span className="text-secondary-text">Total PPN:</span>
                <span className="ml-2 font-medium text-primary-text">
                  {formatCurrency(summary.totalPPN)}
                </span>
              </div>
              <div>
                <span className="text-secondary-text">Grand Total:</span>
                <span className="ml-2 font-medium text-primary">
                  {formatCurrency(summary.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}