import { ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";

export default function SidebarItem({ item, open, toggleDropdown, collapsed }) {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === item.path;
  const hasActiveChild =
    item.children &&
    item.children.some((child) => location.pathname.startsWith(child.path));
  const activeOrChild = isActive || hasActiveChild;

  return (
    <div>
      <button
        aria-expanded={item.children ? open : undefined}
        onClick={() =>
          item.children ? toggleDropdown() : !isActive && navigate(item.path)
        }
        className={`w-full flex items-center ${
          collapsed ? "justify-center" : "justify-between"
        } px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group cursor-pointer`}
        style={{
          backgroundColor: activeOrChild ? colors.primaryLight : "transparent",
          borderWidth: activeOrChild ? "1px" : "0",
          borderStyle: activeOrChild ? "solid" : "none",
          borderColor: activeOrChild ? colors.primary : "transparent",
          color: activeOrChild ? colors.primary : colors.text.secondary,
        }}
        onMouseEnter={(e) => {
          if (!activeOrChild) {
            e.currentTarget.style.backgroundColor = colors.background.tertiary;
            e.currentTarget.style.color = colors.primary;
            e.currentTarget.style.transform = "translateX(2px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!activeOrChild) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = colors.text.secondary;
            e.currentTarget.style.transform = "translateX(0)";
          }
        }}
      >
        {/* Icon + Label */}
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <item.icon
            size={18}
            style={{
              color: activeOrChild ? colors.primary : colors.text.secondary,
            }}
          />
          {!collapsed && <span>{item.label}</span>}
        </div>

        {/* Chevron only if expanded */}
        {!collapsed &&
          item.children &&
          (open ? (
            <ChevronDown size={16} style={{ color: colors.text.secondary }} />
          ) : (
            <ChevronRight size={16} style={{ color: colors.text.secondary }} />
          ))}
      </button>

      {/* Submenu only if expanded */}
      {!collapsed && (
        <div
          className={`mt-1 ml-2 space-y-1 border-l transition-all duration-300 ${
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{ borderColor: colors.border.primary }}
        >
          {item.children?.map((sub, i) => {
            const isSubActive = location.pathname.startsWith(sub.path);
            return (
              <button
                key={i}
                onClick={() => !isSubActive && navigate(sub.path)}
                className="w-full pl-8 py-2.5 text-sm rounded-md transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: isSubActive
                    ? colors.primaryLight
                    : "transparent",
                  color: isSubActive ? colors.primary : colors.text.secondary,
                }}
                onMouseEnter={(e) => {
                  if (!isSubActive) {
                    e.currentTarget.style.backgroundColor =
                      colors.background.tertiary;
                    e.currentTarget.style.color = colors.primary;
                    e.currentTarget.style.transform = "translateX(2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = colors.text.secondary;
                    e.currentTarget.style.transform = "translateX(0)";
                  }
                }}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
