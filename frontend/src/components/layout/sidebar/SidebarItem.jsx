import { ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";

export default function SidebarItem({ item, open, toggleDropdown }) {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === item.path;
  const isParentActive =
    item.children &&
    item.children.some((c) => location.pathname.startsWith(c.path));

  return (
    <div>
      <button
        aria-expanded={item.children ? open : undefined}
        onClick={() =>
          item.children
            ? toggleDropdown(item.label)
            : !isActive && navigate(item.path)
        }
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group"
        style={{
          backgroundColor: isActive ? colors.primaryLight : "transparent",
          borderWidth: isActive ? "1px" : "0",
          borderStyle: isActive ? "solid" : "none",
          borderColor: isActive ? colors.primary : "transparent",
          color: isActive ? colors.primary : colors.text.secondary,
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = colors.background.tertiary;
            e.currentTarget.style.color = colors.primary;
            e.currentTarget.style.transform = "translateX(2px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = colors.text.secondary;
            e.currentTarget.style.transform = "translateX(0)";
          }
        }}
      >
        <div className="flex items-center gap-3">
          <item.icon
            size={18}
            style={{
              color:
                isActive || isParentActive
                  ? colors.primary
                  : colors.text.secondary,
            }}
            className="group-hover:transition-colors"
          />
          <span>{item.label}</span>
        </div>
        {item.children &&
          (open ? (
            <ChevronDown size={16} style={{ color: colors.text.secondary }} />
          ) : (
            <ChevronRight size={16} style={{ color: colors.text.secondary }} />
          ))}
      </button>

      {item.children && open && (
        <div
          className="mt-1 ml-2 space-y-1 border-l"
          style={{ borderColor: colors.border.primary }}
        >
          {item.children.map((sub, i) => {
            const isSubActive = location.pathname === sub.path;
            return (
              <button
                key={i}
                onClick={() => !isSubActive && navigate(sub.path)}
                className="w-full pl-8 py-2.5 text-sm rounded-md transition-all duration-200"
                style={{
                  backgroundColor: isSubActive
                    ? colors.primaryLight
                    : "transparent",
                  borderWidth: isSubActive ? "1px" : "0",
                  borderStyle: isSubActive ? "solid" : "none",
                  borderColor: isSubActive ? colors.primary : "transparent",
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
