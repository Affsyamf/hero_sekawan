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
            ? "bg-blue-50 border border-blue-200 text-blue-600 font-semibold"
            : "text-gray-600 hover:bg-gray-100 hover:text-blue-600 hover:translate-x-[2px]"
        }`}
      >
        <div className="flex items-center gap-3">
          <item.icon
            size={18}
            className={`${
              isActive || isParentActive
                ? "text-blue-600"
                : "text-gray-600 group-hover:text-blue-600"
            }`}
          />
          <span>{item.label}</span>
        </div>
        {item.children &&
          (open ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
      </button>

      {item.children && open && (
        <div className="mt-1 ml-2 space-y-1 border-l border-gray-200">
          {item.children.map((sub, i) => {
            const isSubActive = location.pathname === sub.path;
            return (
              <button
                key={i}
                onClick={() => !isSubActive && navigate(sub.path)}
                className={`w-full pl-8 py-2.5 text-sm rounded-md transition-all duration-200
                ${
                  isSubActive
                    ? "bg-blue-50 border border-blue-200 text-blue-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-blue-600 hover:translate-x-[2px]"
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
