import {
  ShoppingBag,
  ShoppingCart,
  FileBarChart2,
  Package,
  FlaskConical,
  ClipboardCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import SidebarItem from "./SidebarItem";
import SidebarFooter from "./SidebarFooter";

// 👉 Config menu (unchanged)
const menuItems = [
  { isHeader: true, text: "Main" },
  {
    label: "Reports",
    icon: FileBarChart2,
    children: [
      { label: "Dashboard", path: "/dashboard/overview" },
      { label: "Purchasing", path: "/dashboard/purchasings" },
      { label: "Color Kitchen", path: "/dashboard/color-kitchens" },
    ],
  },

  { isHeader: true, text: "Master Data" },
  {
    label: "Master Data",
    icon: ShoppingBag,
    children: [
      { label: "Products", path: "/products" },
      { label: "Suppliers", path: "/suppliers" },
      { label: "Accounts", path: "/accounts" },
      { label: "Design", path: "/designs" },
    ],
  },

  { isHeader: true, text: "Transactions" },
  { label: "Purchasing", icon: ShoppingCart, path: "/purchasings" },
  { label: "Stock Movement", icon: Package, path: "/stock-movements" },
  { label: "Color Kitchen", icon: FlaskConical, path: "/color-kitchens" },
  { label: "Stock Opname", icon: ClipboardCheck, path: "/stock-opnames" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { colors } = useTheme();

  // ✅ Default all dropdowns open
  const [openDropdowns, setOpenDropdowns] = useState({});

  useEffect(() => {
    const initial = {};
    menuItems.forEach((item) => {
      if (item.children) initial[item.label] = true;
    });
    setOpenDropdowns(initial);
  }, []);

  // ✅ Independent toggles — multiple open at once
  const toggleDropdown = (label) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden transition-opacity duration-300"
          style={{ backgroundColor: colors.background.overlay }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 flex flex-col justify-between w-64 h-screen border-r transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: colors.background.sidebar,
          borderColor: colors.border.primary,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              backgroundColor: colors.primary,
              color: colors.text.inverse,
            }}
          >
            <ShoppingBag size={16} />
          </div>
          <h1
            className="text-xl font-semibold"
            style={{ color: colors.text.primary }}
          >
            Hero Sekawan
          </h1>
        </div>

        {/* Menu */}
        <div className="flex-1 px-6 overflow-y-auto">
          <nav className="pb-4 space-y-1" role="navigation">
            {menuItems.map((item, idx) =>
              item.isHeader ? (
                <div
                  key={idx}
                  className="px-2 pt-4 pb-2 text-xs font-semibold tracking-wider uppercase"
                  style={{ color: colors.text.tertiary }}
                >
                  {item.text}
                </div>
              ) : (
                <SidebarItem
                  key={idx}
                  item={item}
                  open={!!openDropdowns[item.label]}
                  toggleDropdown={() => toggleDropdown(item.label)}
                />
              )
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0">
          <SidebarFooter user={{ name: "MarcelE", role: "Admin" }} />
        </div>
      </aside>
    </>
  );
}
