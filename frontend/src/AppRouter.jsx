import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./assets/styles/tailwind.css";
import Dashboard from "./pages/Dashboard";


export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
