import { useTheme } from "../contexts/ThemeContext";
import Card from "../components/ui/card/Card";
import Button from "../components/ui/button/Button";
import Table from "../components/ui/table/Table";
import Chart from "../components/ui/chart/Chart";
import { Eye, DollarSign, Activity, Filter, Download } from "lucide-react";
import { MainLayout } from "../layouts";

export default function Dashboard() {
  const { colors } = useTheme();

  // Dummy API fetch
  const fetchIntegrations = async () => {
    return {
      rows: [
        { id: 1, app: "Stripe", type: "Finance", rate: "40%", profit: "$650" },
        { id: 2, app: "Zapier", type: "CRM", rate: "80%", profit: "$720.5" },
        {
          id: 3,
          app: "Shopify",
          type: "Marketplace",
          rate: "20%",
          profit: "$432",
        },
      ],
      total: 3,
    };
  };

  const columns = [
    { key: "app", label: "Application" },
    { key: "type", label: "Type" },
    { key: "rate", label: "Rate" },
    { key: "profit", label: "Profit" },
  ];

  // Sample data for charts
  const salesData = [
    { month: "Jan", value: 20, type: "actual", label: "$20k" },
    { month: "Feb", value: 35, type: "actual", label: "$35k" },
    { month: "Mar", value: 25, type: "actual", label: "$25k" },
    { month: "Apr", value: 45, type: "actual", label: "$45k" },
    { month: "May", value: 30, type: "actual", label: "$30k" },
    { month: "Jun", value: 55, type: "actual", label: "$55k" },
    { month: "Jul", value: 40, type: "actual", label: "$40k" },
    { month: "Aug", value: 65, type: "actual", label: "$65k" },
    { month: "Sep", value: 50, type: "projection", label: "$50k" },
    { month: "Oct", value: 70, type: "projection", label: "$70k" },
    { month: "Nov", value: 60, type: "projection", label: "$60k" },
    { month: "Dec", value: 80, type: "projection", label: "$80k" },
  ];

  const subscribersData = [12, 19, 25, 30, 35, 28, 42, 38, 45, 52, 48, 55];

  const salesDistributionData = [
    { label: "Delivered", value: 35 },
    { label: "In Progress", value: 48 },
    { label: "To-do", value: 17 },
  ];

  const performanceData = [
    { label: "CPU", value: 46, maxValue: 100, color: "info" },
    { label: "Entertainment", value: 37, maxValue: 100, color: "primary" },
    { label: "Productivity", value: 45, maxValue: 100, color: "success" },
    { label: "Games", value: 24, maxValue: 100, color: "warning" },
  ];

  return (
    <MainLayout>
      <div className="max-w-full space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="2024-01-01"
            />
            <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Monthly</option>
              <option>Weekly</option>
            </select>
            <Button icon={Filter} label="Filter" variant="secondary" />
            <Button icon={Download} label="Export" variant="primary" />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Chart.Metric
            title="Page Views"
            value="12,450"
            trend="+15.8%"
            icon={Eye}
          />

          <Chart.Metric
            title="Total Revenue"
            value="$363.95"
            trend="-34.0%"
            icon={DollarSign}
          />

          <Chart.Metric
            title="Bounce Rate"
            value="86.5%"
            trend="+24.2%"
            icon={Activity}
          />
          <Chart.Metric
            title="Bounce Rate"
            value="86.5%"
            trend="+24.2%"
            icon={Activity}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex lg:col-span-9">
            <Card className="w-full">
              <Chart.Bar
                initialData={[
                  { label: "Jan", productIn: 1000000, productOut: 800000 },
                  { label: "Feb", productIn: 1200000, productOut: 950000 },
                  { label: "Mar", productIn: 1100000, productOut: 900000 },
                ]}
                title="Product In vs Out Comparison"
                subtitle="Compare your product flow"
                datasets={[
                  { key: "productIn", label: "Product In", color: "success" },
                  { key: "productOut", label: "Product Out", color: "error" },
                ]}
                periods={["Q2 2024", "Q1 2024", "Q4 2023"]}
                onFetchData={salesData}
                showSummary={true}
              />
            </Card>
          </div>

          <div className="flex lg:col-span-3">
            <Card className="w-full">
              <h3 className="mb-6 font-semibold text-gray-900">Performance</h3>
              <div className="space-y-6">
                {performanceData.map((item, index) => (
                  <Chart.Progress
                    key={index}
                    label={`${item.label} ${item.value}%`}
                    value={item.value}
                    maxValue={item.maxValue}
                    color={item.color}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Chart.Line
            data={subscribersData}
            value="$12,100"
            trend={50}
            title="Total revenue"
          />

          <Chart.Donut
            data={salesDistributionData}
            centerText={{
              value: "100%",
              label: "orders",
            }}
          />
        </div>

        {/* Performance Metrics */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">List of Integration</h3>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              See All
            </button>
          </div>
          <Table
            columns={columns}
            fetchData={fetchIntegrations}
            pageSizeOptions={[3]}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
