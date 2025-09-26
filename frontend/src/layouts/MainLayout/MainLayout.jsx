//MainLayout.jsx
import { useState } from "react";
import { Navbar, Sidebar, Footer } from "../../components/layout";
import { useTheme } from "../../contexts/ThemeContext";

export default function MainLayout({ children }) {
  const { colors } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      style={{ background: colors.background.primary }}
      className="flex min-h-screen"
    >
      {/* Sidebar - Fixed */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area - dengan margin untuk sidebar */}
      <div className="flex flex-col flex-1 min-h-screen lg:ml-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
