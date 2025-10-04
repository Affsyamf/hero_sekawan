import { useTheme } from "../contexts/ThemeContext";
import Card from "../components/ui/card/Card";
import Button from "../components/ui/button/Button";
import Table from "../components/ui/table/Table";
import Chart from "../components/ui/chart/Chart";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Filter, Download, Droplets } from "lucide-react";
import { MainLayout } from "../layouts";

export default function Dashboard() {
  const { colors } = useTheme();

  // Dummy API fetch untuk tabel transaksi
  const fetchTransactions = async () => {
    return {
      rows: [
        { id: 1, date: "2024-12-15", type: "Purchasing", ref: "PO-2024-123", product: "Pigment Merah", qty: 500, location: "Gudang" },
        { id: 2, date: "2024-12-15", type: "Stock Movement", ref: "SM-2024-089", product: "Binder", qty: -150, location: "Kitchen" },
        { id: 3, date: "2024-12-14", type: "Color Kitchen", ref: "CK-2024-234", product: "Pigment Biru", qty: -200, location: "Usage" },
        { id: 4, date: "2024-12-14", type: "Purchasing", ref: "PO-2024-124", product: "Thickener", qty: 300, location: "Gudang" },
        { id: 5, date: "2024-12-13", type: "Stock Opname", ref: "SO-2024-012", product: "Pigment Kuning", qty: -15, location: "Opname" },
        { id: 6, date: "2024-12-13", type: "Purchasing", ref: "PO-2024-125", product: "Pigment Hitam", qty: 450, location: "Gudang" },
        { id: 7, date: "2024-12-12", type: "Stock Movement", ref: "SM-2024-090", product: "Pigment Merah", qty: -200, location: "Kitchen" },
        { id: 8, date: "2024-12-12", type: "Color Kitchen", ref: "CK-2024-235", product: "Binder", qty: -180, location: "Usage" },
        { id: 9, date: "2024-12-11", type: "Purchasing", ref: "PO-2024-126", product: "Pigment Hijau", qty: 350, location: "Gudang" },
        { id: 10, date: "2024-12-11", type: "Stock Opname", ref: "SO-2024-013", product: "Thickener", qty: -8, location: "Opname" },
      ],
      total: 10,
    };
  };

  const transactionColumns = [
    { key: "date", label: "Tanggal" },
    { 
      key: "type", 
      label: "Tipe",
      render: (value) => {
        const colors = {
          "Purchasing": "bg-green-100 text-green-800",
          "Stock Movement": "bg-blue-100 text-blue-800",
          "Color Kitchen": "bg-purple-100 text-purple-800",
          "Stock Opname": "bg-orange-100 text-orange-800"
        };
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        );
      }
    },
    { key: "ref", label: "Referensi" },
    { key: "product", label: "Product" },
    { 
      key: "qty", 
      label: "Qty (kg)",
      render: (value) => (
        <span className={`font-medium ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {value > 0 ? '+' : ''}{value}
        </span>
      )
    },
    { key: "location", label: "Lokasi" },
  ];

  // Data untuk Stock Flow Chart (Bar Chart)
  const stockFlowData = [
    { label: "Jan", stockMasuk: 15000, stockKeluar: 12000 },
    { label: "Feb", stockMasuk: 18000, stockKeluar: 14000 },
    { label: "Mar", stockMasuk: 16000, stockKeluar: 13500 },
    { label: "Apr", stockMasuk: 19000, stockKeluar: 15000 },
    { label: "May", stockMasuk: 17000, stockKeluar: 14500 },
    { label: "Jun", stockMasuk: 20000, stockKeluar: 16000 },
  ];

  // Data untuk Stock Location (Donut Chart)
  const stockLocationData = [
    { label: "Pigment Merah", value: 34 }, // 5600kg = 34%
    { label: "Pigment Biru", value: 15 }, // 2400kg = 15%
    { label: "Pigment Kuning", value: 50 }, // 8300kg = 50%
    { label: "Binder", value: 1 }, // 124kg = 1%
  ];

  // Data untuk Top Products (Progress bars)
  const topProductsData = [
    { label: "Pigment Merah", value: 85, maxValue: 100, color: "error" },
    { label: "Pigment Biru", value: 75, maxValue: 100, color: "primary" },
    { label: "Pigment Kuning", value: 60, maxValue: 100, color: "warning" },
    { label: "Binder", value: 50, maxValue: 100, color: "success" },
    { label: "Thickener", value: 40, maxValue: 100, color: "info" },
  ];

  // Data untuk Design Cost (Line Chart untuk trend)
  const designCostTrend = [45, 52, 48, 58, 54, 62, 59];

  // Data untuk Design Cost Cards
  const designCostData = [
    { design: "BTK-001", cost: 4500000, orders: 45 },
    { design: "BTK-002", cost: 3800000, orders: 38 },
    { design: "BTK-003", cost: 5200000, orders: 52 },
    { design: "BTK-004", cost: 2900000, orders: 29 },
    { design: "BTK-005", cost: 4100000, orders: 41 },
  ];

  return (
    <MainLayout>
      <div className="max-w-full space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard Produksi</h1>
            <p className="mt-1 text-sm text-gray-600">Monitoring Stock & Cost Produksi Kain Printing</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Bulan Ini</option>
              <option>3 Bulan Terakhir</option>
              <option>6 Bulan Terakhir</option>
              <option>Tahun Ini</option>
            </select>
            <Button icon={Filter} label="Filter" variant="secondary" />
            <Button icon={Download} label="Export" variant="primary" />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Chart.Metric
            title="Total Stock Masuk (Bulan Ini)"
            value="12,450 kg"
            trend="+15.8%"
            icon={TrendingUp}
          />

          <Chart.Metric
            title="Total Stock Keluar (Bulan Ini)"
            value="8,363 kg"
            trend="+12.3%"
            icon={TrendingDown}
          />

          <Chart.Metric
            title="Total Cost Produksi"
            value="Rp 45.5 Jt"
            trend="-8.5%"
            icon={DollarSign}
          />
          
          <Chart.Metric
            title="Selisih Stock Opname"
            value="124 kg"
            trend="+5.2%"
            icon={AlertTriangle}
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
          {/* Stock Flow Chart */}
          <div className="lg:col-span-8">
            <Card className="w-full h-full">
              <Chart.Bar
                initialData={stockFlowData}
                title="Pergerakan Stock (Masuk vs Keluar)"
                subtitle="Monitoring alur stock purchasing hingga usage"
                datasets={[
                  { key: "stockMasuk", label: "Stock Masuk", color: "success" },
                  { key: "stockKeluar", label: "Stock Keluar", color: "primary" },
                ]}
                periods={["6 Bulan", "3 Bulan", "1 Bulan"]}
                onFetchData={stockFlowData}
                showSummary={true}
              />
            </Card>
          </div>

          {/* Stock Location Donut */}
          <div className="lg:col-span-4">
            <Chart.Donut
              data={stockLocationData}
              centerText={{
                value: "16,424",
                label: "Total kg",
              }}
              title="Stock Per Lokasi"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Second Row - Products & Designs */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Products by Usage */}
          <Card>
            <h3 className="mb-6 font-semibold text-gray-900">Product Paling Cepat Habis</h3>
            <div className="space-y-6">
              {topProductsData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <Chart.Progress
                      label={item.label}
                      value={item.value}
                      maxValue={item.maxValue}
                      color={item.color}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Design Production Cost */}
          <Card>
            <h3 className="mb-6 font-semibold text-gray-900">Cost Produksi Per Design</h3>
            <div className="space-y-3">
              {designCostData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                      <Droplets className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.design}</p>
                      <p className="text-xs text-gray-600">{item.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      Rp {(item.cost / 1000000).toFixed(1)}jt
                    </p>
                    <p className="text-xs text-gray-600">
                      @{(item.cost / item.orders / 1000).toFixed(0)}k/order
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom Row - Trend Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Design Cost Trend */}
          <Chart.Line
            data={designCostTrend}
            value="Rp 45.5 Jt"
            trend={12.5}
            title="Trend Cost Produksi"
          />

          {/* Stock Movement by Product */}
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 md:text-base">Distribusi Stock Berdasarkan Product</h3>
            <div className="space-y-3">
              {stockLocationData.map((item, idx) => {
                const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-700 md:text-sm">{item.label}</span>
                      <span className="text-xs text-gray-600">{item.value}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full">
                      <div
                        className="h-2.5 transition-all duration-500 rounded-full"
                        style={{ width: `${item.value}%`, backgroundColor: colors[idx] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Transaksi Terakhir</h3>
              <p className="mt-1 text-sm text-gray-600">History pergerakan stock dari semua proses</p>
            </div>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              See All
            </button>
          </div>
          <Table
            columns={transactionColumns}
            fetchData={fetchTransactions}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </Card>
      </div>
    </MainLayout>
  );
}