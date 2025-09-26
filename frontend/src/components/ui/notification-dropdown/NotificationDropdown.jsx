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
        <button className="relative p-2 text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full -top-1 -right-1">
              {unreadCount}
            </span>
          )}
        </button>
      }
    >
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
      </div>
      <div className="overflow-y-auto max-h-64">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              n.unread ? "bg-blue-50" : ""
            }`}
          >
            <p className="text-sm font-medium text-gray-900">{n.title}</p>
            <p className="mt-1 text-xs text-gray-500">{n.time}</p>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-200">
        <button className="w-full text-sm font-medium text-blue-600 hover:text-blue-700">
          View all notifications
        </button>
      </div>
    </Dropdown>
  );
}
