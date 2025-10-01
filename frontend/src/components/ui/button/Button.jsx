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
      className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${className}`}
      style={{
        background: colors.primary,
        color: colors.text.inverse,
      }}
      {...props}
    >
      {/* Icon */}
      {Icon && <Icon size={16} className="mr-2" />}

      {/* Label */}
      <span>{label}</span>

      {/* Optional dropdown arrow */}
      {showDropdown && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 ml-2"
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
