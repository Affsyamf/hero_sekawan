import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./assets/styles/tailwind.css";
import { Dashboard, AccountsPage, DesignsPage, DesignTypesPage, SuppliersPage, PurchasingsPage, ProductsPage, StockMovementsPage, ColorKitchensPage, StockOpnamePage, PurchasingReportsPage, OverviewNew, DashboardPurchasing, DashboardColorKitchen } from "./pages";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OverviewNew />} />
        <Route path="/dashboard/purchasings" element={<DashboardPurchasing />} />
        <Route path="/dashboard/color-kitchens" element={<DashboardColorKitchen />} />
        

        <Route path="/products" element={<ProductsPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/designs" element={<DesignsPage />} />
        <Route path="/design-types" element={<DesignTypesPage />} />

        <Route path="/purchasings" element={<PurchasingsPage />} />
        <Route path="/stock-movements" element={<StockMovementsPage />} />
        <Route path="/color-kitchens" element={<ColorKitchensPage />} />
        <Route path="/stock-opnames" element={<StockOpnamePage />} />


        <Route path="/reports/purchasings" element={<PurchasingReportsPage />} />
      </Routes>
    </Router>
  );
}
