import { ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function SidebarItem({ item, open, toggleDropdown }) {
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
        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group
        ${
          isActive
            ? "bg-primary/10 border border-primary/20 text-primary font-semibold"
            : "text-secondary-text hover:bg-background hover:text-primary hover:translate-x-[2px]"
        }`}
      >
        <div className="flex items-center gap-3">
          <item.icon
            size={18}
            className={`${
              isActive || isParentActive
                ? "text-primary"
                : "text-secondary-text group-hover:text-primary"
            }`}
          />
          <span>{item.label}</span>
        </div>
        {item.children &&
          (open ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
      </button>

      {item.children && open && (
        <div className="mt-1 ml-2 space-y-1 border-l border-default">
          {item.children.map((sub, i) => {
            const isSubActive = location.pathname === sub.path;
            return (
              <button
                key={i}
                onClick={() => !isSubActive && navigate(sub.path)}
                className={`w-full pl-8 py-2.5 text-sm rounded-md transition-all duration-200
                ${
                  isSubActive
                    ? "bg-primary/10 border border-primary/20 text-primary font-semibold"
                    : "text-secondary-text hover:bg-background hover:text-primary hover:translate-x-[2px]"
                }`}
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
