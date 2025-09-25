import { useState } from "react";
import Dropdown from "./Dropdown";

export default function DropdownSelect({ options = [], value, onChange }) {
  const selected = options.find((opt) => opt.value === value);

  return (
    <Dropdown
      trigger={
        <button className="w-full px-4 py-2 text-sm text-left border rounded-lg">
          {selected ? selected.label : "Select..."}
        </button>
      }
      align="left"
    >
      <div className="overflow-y-auto max-h-60">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-background`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Dropdown>
  );
}
