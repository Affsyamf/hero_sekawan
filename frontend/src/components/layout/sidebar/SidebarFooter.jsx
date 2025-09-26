import { LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

export default function SidebarFooter({ user }) {
  const { isDark, toggleTheme } = useTheme();
  const initial = user?.name?.charAt(0) || "U";

  return (
    <div className="p-6 space-y-1 border-t border-light">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all hover:bg-muted hover:text-primary"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
      </button>

      {/* Profile + Logout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-primary">
            {initial}
          </div>
          <div>
            <p className="text-sm font-medium text-primary-text">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-secondary-text">
              {user?.role || "Guest"}
            </p>
          </div>
        </div>
        <button className="p-2 rounded-lg text-danger hover:bg-danger/10">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
