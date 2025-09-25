import { Bell } from "lucide-react";
import Dropdown from "../../ui/dropdown/Dropdown";

export default function NotificationDropdown() {
  const notifications = [
    { id: 1, title: "New order received", time: "2 min ago", unread: true },
    { id: 2, title: "Payment completed", time: "1 hour ago", unread: true },
    { id: 3, title: "Product stock low", time: "3 hours ago", unread: false },
  ];
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <Dropdown
      trigger={
        <button className="relative p-2 rounded-lg hover:bg-background text-secondary-text hover:text-primary-text">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-medium text-white rounded-full -top-1 -right-1 bg-danger">
              {unreadCount}
            </span>
          )}
        </button>
      }
    >
      <div className="p-4 border-b border-light">
        <h3 className="text-sm font-semibold text-primary-text">
          Notifications
        </h3>
      </div>
      <div className="overflow-y-auto max-h-64">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 border-b border-light hover:bg-background transition-colors ${
              n.unread ? "bg-primary/5" : ""
            }`}
          >
            <p className="text-sm font-medium text-primary-text">{n.title}</p>
            <p className="mt-1 text-xs text-secondary-text">{n.time}</p>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-light">
        <button className="w-full text-sm font-medium text-primary hover:text-primary/80">
          View all notifications
        </button>
      </div>
    </Dropdown>
  );
}
