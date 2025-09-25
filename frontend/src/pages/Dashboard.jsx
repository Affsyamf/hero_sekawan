import { useTheme } from "../context/ThemeContext";
import Card from "../components/ui/card/Card";
import Button from "../components/ui/button/Button";
import Table from "../components/ui/table/Table";
import {
  Eye,
  DollarSign,
  Activity,
  Filter,
  Download,
} from "lucide-react";
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-primary-text">
            Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <input type="date" className="px-2 py-1 text-sm border rounded" />
            <select className="px-2 py-1 text-sm border rounded">
              <option>Monthly</option>
              <option>Weekly</option>
            </select>
            <Button icon={Filter} label="Filter" variant="secondary" />
            <Button icon={Download} label="Export" variant="secondary" />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-text">Page Views</p>
                <h2 className="text-2xl font-semibold text-primary-text">
                  12,450
                </h2>
                <p className="text-xs text-green-500">+15.8%</p>
              </div>
              <Eye className="text-primary" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-text">Total Revenue</p>
                <h2 className="text-2xl font-semibold text-primary-text">
                  $363.95
                </h2>
                <p className="text-xs text-red-500">-34.0%</p>
              </div>
              <DollarSign className="text-primary" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-text">Bounce Rate</p>
                <h2 className="text-2xl font-semibold text-primary-text">
                  86.5%
                </h2>
                <p className="text-xs text-green-500">+24.2%</p>
              </div>
              <Activity className="text-primary" />
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Sales Overview</h3>
              <div className="flex gap-2">
                <Button icon={Filter} label="Filter" variant="secondary" />
              </div>
            </div>
            <div className="flex items-center justify-center h-48 text-secondary-text">
              [Bar Chart Here]
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Total Subscribers</h3>
              <select className="px-2 py-1 text-sm border rounded">
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div className="flex items-center justify-center h-48 text-secondary-text">
              [Column Chart Here]
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Sales Distribution</h3>
              <select className="px-2 py-1 text-sm border rounded">
                <option>Monthly</option>
                <option>Weekly</option>
              </select>
            </div>
            <div className="flex items-center justify-center h-48 text-secondary-text">
              [Pie Chart Here]
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">List of Integration</h3>
              <button className="text-sm text-primary">See All</button>
            </div>
            <Table
              columns={columns}
              fetchData={fetchIntegrations}
              pageSizeOptions={[3]}
            />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
