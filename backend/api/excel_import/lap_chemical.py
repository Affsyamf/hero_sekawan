import pandas as pd
import json
from io import BytesIO
from sqlalchemy.orm import Session

def run(
    contents: bytes,
    db: Session,
):
    df = pd.read_excel(
        BytesIO(contents),
        sheet_name="CHEMICAL",
        header=4
    )

    df = df.iloc[:, :-2]

    # df.dropna(axis=1, how="all", inplace=True)

    json_data = (df.dropna(axis=1, how="all")
                .applymap(lambda x: x.isoformat() if hasattr(x, "isoformat") else x)
                .to_dict(orient="records"))

    # # Save to file
    # with open("lap_chemical.json", "w", encoding="utf-8") as f:
    #     json.dump(json_data, f, ensure_ascii=False, indent=2)

    # print("✅ JSON saved to lap_chemical.json")