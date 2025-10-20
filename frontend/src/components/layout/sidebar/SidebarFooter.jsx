import { LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

export default function SidebarFooter({ user }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const initial = user?.name?.charAt(0) || "U";

  return (
    <div
      className="p-6 space-y-1 border-t"
      style={{ borderColor: colors.border.primary }}
    >
      {/* <button
        onClick={toggleTheme}
        className="flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all"
        style={{ color: colors.text.secondary }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.background.tertiary;
          e.currentTarget.style.color = colors.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = colors.text.secondary;
        }}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
      </button> */}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full"
            style={{
              backgroundColor: colors.primary,
              color: colors.text.inverse,
            }}
          >
            {initial}
          </div>
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: colors.text.primary }}
            >
              {user?.name || "User"}
            </p>
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              {user?.role || "Guest"}
            </p>
          </div>
        </div>
        <button
          className="p-2 transition-all rounded-lg"
          style={{ color: colors.status.error }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.status.errorLight;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
