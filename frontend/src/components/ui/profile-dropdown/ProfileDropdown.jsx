import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import Dropdown from "../../ui/dropdown/Dropdown";

export default function ProfileDropdown() {
  const menuItems = [
    { icon: <User size={16} />, label: "Profile" },
    { icon: <Settings size={16} />, label: "Settings" },
  ];

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100">
          <img
            src="https://i.pravatar.cc/40"
            alt="User Avatar"
            className="w-8 h-8 border border-gray-200 rounded-full"
          />
          <span className="hidden text-sm font-medium text-gray-900 sm:block">
            MarcelE
          </span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>
      }
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src="https://i.pravatar.cc/40"
            alt="User Avatar"
            className="w-10 h-10 border border-gray-200 rounded-full"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">MarcelE</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>

      <div className="py-2">
        {menuItems.map((item, i) => (
          <button
            key={i}
            className="flex items-center w-full gap-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="py-2 border-t border-gray-200">
        <button className="flex items-center w-full gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </Dropdown>
  );
}
