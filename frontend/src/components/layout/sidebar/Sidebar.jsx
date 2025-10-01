//Sidebar.jsx
import {
  ShoppingBag,
  Home,
  ShoppingBag as Bag,
  ShoppingCart,
  PackagePlus,
  Truck,
  ReceiptText,
  FileBarChart2,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import SidebarFooter from "./SidebarFooter";

// 👉 Config menu
const menuItems = [
  { isHeader: true, text: "Main" },
  { label: "Overview", icon: Home, path: "/" },

  { isHeader: true, text: "Master Data" },
  {
    label: "Master Data",
    icon: Bag,
    children: [
      { label: "Products", path: "/products" },
      { label: "Warehouses", path: "/warehouses" },
      { label: "Customers", path: "/customers" },
    ],
  },

  { isHeader: true, text: "Purchasing" },
  { label: "Purchasing", icon: ShoppingCart, path: "/purchasing" },

  { isHeader: true, text: "Transactions" },
  { label: "Sales", icon: ReceiptText, path: "/transactions" },

  { isHeader: true, text: "Reports" },
  { label: "Reports", icon: FileBarChart2, path: "/reports" },

  { isHeader: true, text: "Settings" },
  {
    label: "Settings",
    icon: Settings,
    children: [{ label: "Jenis Barang", path: "/production-estimate" }],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const [openDropdowns, setOpenDropdowns] = useState({});
  const location = useLocation();

  // 👉 Toggle dropdown menu
  const toggleDropdown = (label) => {
    setOpenDropdowns((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // 👉 Auto open section sesuai route aktif
  useEffect(() => {
    const openSections = {};
    menuItems.forEach((item) => {
      if (item.children) {
        const isMatch = item.children.some((child) =>
          location.pathname.startsWith(child.path)
        );
        if (isMatch) openSections[item.label] = true;
      }
    });
    setOpenDropdowns(openSections);
  }, [location.pathname]);

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - FIXED POSITION */}
      <aside
        className={`fixed top-0 left-0 z-50 flex flex-col justify-between w-64 h-screen border-r bg-white border-gray-200
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-lg">
            <ShoppingBag size={16} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Hero Sekawan</h1>
        </div>

        {/* Menu - Scrollable area */}
        <div className="flex-1 px-6 overflow-y-auto">
          <nav className="pb-4 space-y-1" role="navigation">
            {menuItems.map((item, idx) =>
              item.isHeader ? (
                <div
                  key={idx}
                  className="px-2 pt-4 pb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase"
                >
                  {item.text}
                </div>
              ) : (
                <SidebarItem
                  key={idx}
                  item={item}
                  open={openDropdowns[item.label]}
                  toggleDropdown={toggleDropdown}
                />
              )
            )}
          </nav>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0">
          <SidebarFooter user={{ name: "MarcelE", role: "Admin" }} />
        </div>
      </aside>
    </>
  );
}
