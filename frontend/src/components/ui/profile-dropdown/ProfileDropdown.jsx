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
        <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-background">
          <img
            src="https://i.pravatar.cc/40"
            alt="User Avatar"
            className="w-8 h-8 border rounded-full border-default"
          />
          <span className="hidden text-sm font-medium sm:block text-primary-text">
            MarcelE
          </span>
          <ChevronDown size={16} className="text-secondary-text" />
        </button>
      }
    >
      <div className="p-4 border-b border-light">
        <div className="flex items-center gap-3">
          <img
            src="https://i.pravatar.cc/40"
            alt="User Avatar"
            className="w-10 h-10 border rounded-full border-default"
          />
          <div>
            <p className="text-sm font-medium text-primary-text">MarcelE</p>
            <p className="text-xs text-secondary-text">Admin</p>
          </div>
        </div>
      </div>

      <div className="py-2">
        {menuItems.map((item, i) => (
          <button
            key={i}
            className="flex items-center w-full gap-3 px-4 py-2 text-sm text-secondary-text hover:text-primary-text hover:bg-background"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="py-2 border-t border-light">
        <button className="flex items-center w-full gap-3 px-4 py-2 text-sm text-danger hover:bg-danger/10">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </Dropdown>
  );
}
