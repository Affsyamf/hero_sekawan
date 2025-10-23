import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getColorKitchenById } from "../../services/color_kitchen_service";
import { MainLayout } from "../../layouts";
import Table from "../../components/ui/table/Table";
import { formatCurrency, formatDate } from "../../utils/helpers";
import Card from "../../components/ui/card/Card";
import { ChevronLeft } from "lucide-react";
import GeneralInfoCard from "../../components/ui/card/GeneralInfoCard";
import Loading from "../../components/ui/loading/Loading";

export default function ColorKitchenDetail() {
  const navigate = useNavigate();

  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await getColorKitchenById(id);
        setData(res.data?.data || {});
        console.log(res);
      } catch (err) {
        console.error("Failed to fetch color kitchen entry:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const columns = [
    {
      key: "product_name",
      label: "Name",
      sortable: true,
      render: (v) => <span className="font-medium text-primary-text">{v}</span>,
    },
    {
      key: "quantity",
      label: "Quantity",
      sortable: true,
      render: (value, row) => (
        <span className="text-secondary-text">
          {Number(value || 0)} {row.unit || ""}
        </span>
      ),
    },
    {
      key: "unit_cost_used",
      label: "Cost Per Unit",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">{formatCurrency(v || 0)}</span>
      ),
    },
    {
      key: "total_cost",
      label: "Total Cost",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">{formatCurrency(v || 0)}</span>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="bg-background mx-auto max-w-7xl">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface transition-all cursor-pointer"
            title="Back"
          >
            <ChevronLeft size={22} className="text-secondary-text" />
          </button>
          <h1 className="text-2xl font-bold text-primary-text">
            Color Kitchen Detail #{data ? data.code : ""}
          </h1>
        </div>

        <div className="flex flex-col gap-6 mt-4">
          {loading ? (
            <Loading fullscreen={false} />
          ) : (
            <>
              <GeneralInfoCard
                title="General Information"
                items={[
                  { label: "Code", value: data.code },
                  { label: "Date", value: formatDate(data.date) },
                  { label: "Design", value: data.design_code },
                  { label: "Rolls", value: data.rolls },
                  { label: "Paste Quantity", value: data.paste_quantity },
                ]}
              />
              <Card title="Auxiliaries">
                <Table
                  columns={columns}
                  data={data.details?.aux || []}
                  showDateRangeFilter={false}
                  pagination={false}
                />
              </Card>

              <Card title="Dyes">
                <Table
                  columns={columns}
                  data={data.details?.dye || []}
                  showDateRangeFilter={false}
                  pagination={false}
                />
              </Card>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
