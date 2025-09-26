import pandas as pd
import json
from sqlalchemy.orm import Session
from openpyxl import load_workbook
from io import BytesIO

def run(
    contents: bytes,
    db: Session
):
    wb = load_workbook(BytesIO(contents), data_only=True, keep_links=False)
    
    dfs = {}
    for sheet in wb.sheetnames:
        # Define the header row (Excel is 1-based, so row 6 = header=5 in pandas)
        df = pd.read_excel(
            BytesIO(contents),
            sheet_name=sheet,
            header=6  # tells pandas row 6 is the header
        )

        df = df.iloc[:, :-2]

        # df.dropna(axis=1, how="all", inplace=True)
        dfs[sheet] = df

    json_data = {
        sheet: df.dropna(axis=1, how="all")
                .applymap(lambda x: x.isoformat() if hasattr(x, "isoformat") else x)
                .to_dict(orient="records")
        for sheet, df in dfs.items()
    }

    # # Save to file
    # with open("pembelian_2025.json", "w", encoding="utf-8") as f:
    #     json.dump(json_data, f, ensure_ascii=False, indent=2)

    # print("✅ JSON saved to pembelian_2025.json")