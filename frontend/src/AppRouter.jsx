import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./assets/styles/tailwind.css";
import Dashboard from "./pages/Dashboard";
import PurchasingsPage from "./pages/PurchasingsPage";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/purchasing" element={<PurchasingsPage />} />
      </Routes>
    </Router>
  );
}
