import { useTheme } from "../../../contexts/ThemeContext";

export default function Button({
  icon: Icon, // komponen icon (ex: Plus)
  label, // teks label
  onClick,
  showDropdown = false,
  className = "",
  ...props
}) {
  const { colors } = useTheme();

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${className}`}
      style={{
        background: colors.primary,
        color: colors.text.inverse,
      }}
      {...props}
    >
      {/* Icon */}
      {Icon && <Icon size={14} className="mr-1.5" />}

      {/* Label */}
      <span>{label}</span>

      {/* Optional dropdown arrow */}
      {showDropdown && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3 h-3 ml-1.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      )}
    </button>
  );
}