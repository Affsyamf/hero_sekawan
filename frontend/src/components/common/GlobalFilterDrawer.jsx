import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { useFilterService } from "../../contexts/FilterServiceContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function GlobalFilterDrawer({ isOpen, onClose, width = 288 }) {
  const { registeredComponents } = useFilterService();
  const { colors } = useTheme();

  const navbarHeight = 64;

  return (
    <div
      className={cn(
        "fixed right-0 bg-white border-l shadow-2xl transition-transform duration-300 ease-in-out flex flex-col z-40"
      )}
      style={{
        top: `${navbarHeight}px`,
        height: `calc(100% - ${navbarHeight}px)`,
        width,
        transform: isOpen ? "translateX(0)" : `translateX(${width}px)`,
        backgroundColor: colors.background.primary,
        borderColor: colors.border.secondary,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 pl-4 pr-4 border-b bg-gradient-to-r from-blue-500 to-blue-600">
        <h2 className="text-white font-semibold text-sm">Filters</h2>
        <button
          onClick={onClose}
          className="p-1 text-white transition-colors rounded-lg hover:bg-white hover:bg-opacity-20 hover:text-blue-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Independent scroll area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {registeredComponents?.length ? (
          registeredComponents.map((Comp, idx) => <div key={idx}>{Comp}</div>)
        ) : (
          <p className="text-sm text-gray-500 italic">
            No filters for this page
          </p>
        )}
      </div>
    </div>
  );
}
