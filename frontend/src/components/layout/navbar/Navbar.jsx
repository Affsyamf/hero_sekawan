import { Menu } from "lucide-react";
import NotificationDropdown from "../../ui/notification-dropdown/NotificationDropdown";
import ProfileDropdown from "../../ui/profile-dropdown/ProfileDropdown";

export default function Navbar({ onMenuClick }) {
  return (
    <header className="flex items-center justify-between px-6 py-1 border-b bg-surface border-default">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-background lg:hidden"
      >
        <Menu size={20} className="text-secondary-text" />
      </button>

      <div className="flex items-center gap-4">
        <NotificationDropdown />
        <ProfileDropdown />
      </div>
    </header>
  );
}
