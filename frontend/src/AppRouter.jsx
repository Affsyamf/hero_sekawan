import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./assets/styles/tailwind.css";
import { Dashboard, AccountsPage, DesignsPage, DesignTypesPage, SuppliersPage, PurchasingsPage, ProductsPage, StockMovementsPage, ColorKitchensPage } from "./pages";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/designs" element={<DesignsPage />} />
        <Route path="/design-types" element={<DesignTypesPage />} />

        <Route path="/purchasings" element={<PurchasingsPage />} />
        <Route path="/stock-movements" element={<StockMovementsPage />} />
        <Route path="/color-kitchens" element={<ColorKitchensPage />} />
        <Route path="/stock-opnames" element={<PurchasingsPage />} />
      </Routes>
    </Router>
  );
}
