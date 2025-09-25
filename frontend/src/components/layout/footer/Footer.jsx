import { useTheme } from "../../../context/ThemeContext";

export default function Footer() {
  const { colors } = useTheme();

  return (
    <footer
      className="p-4 text-sm text-center border-t"
      style={{
        background: colors.background.secondary,
        color: colors.text.secondary,
        borderColor: colors.border.primary,
      }}
    >
      © {new Date().getFullYear()} My App. All rights reserved.
    </footer>
  );
}
