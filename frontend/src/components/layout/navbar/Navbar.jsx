import { Menu } from "lucide-react";
import NotificationDropdown from "../../ui/notification-dropdown/NotificationDropdown";
import ProfileDropdown from "../../ui/profile-dropdown/ProfileDropdown";
import { DateRangeFilter } from "../../ui";

export default function Navbar({ onMenuClick }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      <div className="flex justify-end flex-1 mr-2 z-50">
        <DateRangeFilter />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {/* <NotificationDropdown /> */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
