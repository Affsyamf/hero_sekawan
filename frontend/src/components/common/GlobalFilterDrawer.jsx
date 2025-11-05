// components/common/GlobalFilterDrawer.jsx
import { useState, useEffect } from "react";
import { Calendar, X, Filter } from "lucide-react";
import { cn } from "../../utils/cn";
import { useFilterService } from "../../contexts/FilterServiceContext";

export default function GlobalFilterDrawer({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const { registeredComponents } = useFilterService();

  return (
    <>
      {/* Floating Filter Button - Fixed Position */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed z-40 flex items-center gap-2 px-4 py-3 text-sm font-medium text-white transition-all duration-300 rounded-l-xl shadow-lg",
          "hover:pr-6 group",
          "bg-blue-600"
        )}
        style={{
          top: "50%",
          right: 0,
          transform: "translateY(-50%)",
        }}
      >
        <Filter className="w-5 h-5" />
        <span className="hidden group-hover:inline">Filters</span>
        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
      </button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Panel - Slide from Right */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600">
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-white transition-colors rounded-lg hover:bg-white hover:bg-opacity-20 hover:text-blue-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Scrollable content area */}
        <div className="h-[calc(100%-64px)] overflow-y-auto p-6 space-y-4">
          {registeredComponents?.length ? (
            registeredComponents.map((Comp, idx) => <div key={idx}>{Comp}</div>)
          ) : (
            <p className="text-sm text-gray-500 italic">
              No filters for this page
            </p>
          )}
        </div>
      </div>
    </>
  );
}
