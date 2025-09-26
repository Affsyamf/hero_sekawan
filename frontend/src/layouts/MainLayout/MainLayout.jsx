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
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6">{children}</main>

        <Footer />
      </div>
    </div>
  );
}
