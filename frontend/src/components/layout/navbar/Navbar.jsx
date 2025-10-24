import { Menu } from "lucide-react";
import NotificationDropdown from "../../ui/notification-dropdown/NotificationDropdown";
import ProfileDropdown from "../../ui/profile-dropdown/ProfileDropdown";
import { DateRangeFilter } from "../../ui";

export default function Navbar({ onMenuClick }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      <div className="flex justify-end flex-1 mr-2">
        <DateRangeFilter />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {/* <NotificationDropdown /> */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
