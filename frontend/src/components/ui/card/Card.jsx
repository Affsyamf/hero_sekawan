import { useTheme } from "../../../contexts/ThemeContext";

/**
 * Reusable Card component with optional title header.
 * @param {ReactNode} [title] - Optional title text or custom React node.
 * @param {string} [className] - Additional class names for the card.
 * @param {ReactNode} children - Card body content.
 */
export default function Card({ title, children, className = "" }) {
  const { colors } = useTheme();

  return (
    <div
      className={`rounded-xl shadow-md overflow-hidden ${className}`}
      style={{
        background: colors.background.card,
        color: colors.text.primary,
        boxShadow: colors.shadow.md,
      }}
    >
      {/* Optional Title Header (no padding so border spans full width) */}
      {title && (
        <div className="border-b border-gray-300/100 dark:border-gray-700/50">
          <div className="py-3">
            {typeof title === "string" ? (
              <h2 className="text-lg font-semibold text-primary-text px-5">
                {title}
              </h2>
            ) : (
              title
            )}
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-5">{children}</div>
    </div>
  );
}
