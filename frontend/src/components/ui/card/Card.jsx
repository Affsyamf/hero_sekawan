import { useTheme } from "../../../context/ThemeContext";

export default function Card({ children, className = "" }) {
  const { colors } = useTheme();

  return (
    <div
      className={`rounded-xl p-6 shadow-md ${className}`}
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
