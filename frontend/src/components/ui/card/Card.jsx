import { useTheme } from "../../../contexts/ThemeContext";

export default function Card({ children, className = "" }) {
  const { colors } = useTheme();

  return (
    <div
      className={`rounded-xl p-4 shadow-md ${className}`}
      style={{
        background: colors.background.card,
        color: colors.text.primary,
        boxShadow: colors.shadow.md,
      }}
    >
      {children}
    </div>
  );
}
