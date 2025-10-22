import React from "react";
import Card from "./Card";

/**
 * Generic card to display key-value pairs in a clean grid layout.
 * @param {Object[]} items - Array of { label: string, value: ReactNode }
 * @param {number} [columns=3] - Number of columns on desktop
 * @param {string} [title] - Optional card title
 */
export default function GeneralInfoCard({ items = [], columns = 3, title }) {
  return (
    <Card title={title}>
      <div className="p-5">
        <div
          className={`grid grid-cols-2 md:grid-cols-${columns} gap-x-8 gap-y-3`}
        >
          {items.map((item, idx) => (
            <div key={idx}>
              <p className="text-xs text-secondary-text uppercase tracking-wide">
                {item.label}
              </p>
              <p className="text-sm font-medium text-primary-text">
                {item.value ?? "-"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
