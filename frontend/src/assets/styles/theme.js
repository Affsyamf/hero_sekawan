//src/assets/styles/theme.js
export const lightTheme = {
  // Primary Colors
  primary: "#3498db",
  primaryHover: "#2980b9",
  primaryLight: "#ebf3fd",
  primaryDark: "#1f5582",

  // Secondary Colors
  secondary: "#9b59b6",
  secondaryHover: "#8e44ad",
  secondaryLight: "#f5ecfa",
  secondaryDark: "#5e3370",

  // Neutral Colors
  neutral: {
    base: "#e9ecef", // balanced mid-gray for icons or placeholders
    light: "#f8f9fa", // card / background subtle
    lighter: "#f1f3f5", // background faint / hover
    dark: "#6c757d", // secondary text
    darker: "#343a40", // headings / emphasis
    border: "#dee2e6", // borders and dividers
    hover: "#adb5bd", // hover backgrounds
    disabled: "#ced4da", // disabled inputs or buttons
  },

  // Background Colors
  background: {
    primary: "#ffffff",
    secondary: "#f8f9fa",
    tertiary: "#e9ecef",
    card: "#ffffff",
    sidebar: "#ffffff",
    overlay: "rgba(0, 0, 0, 0.5)",
  },

  // Text Colors
  text: {
    primary: "#2c3e50",
    secondary: "#6c757d",
    tertiary: "#adb5bd",
    inverse: "#ffffff",
    muted: "#868e96",
    placeholder: "#ced4da",
  },

  // Status Colors
  status: {
    success: "#27ae60",
    successHover: "#1e874b",
    successLight: "#d5f4e6",
    successDark: "#1e8449",

    warning: "#f39c12",
    warningLight: "#fef9e7",
    warningDark: "#b7950b",

    error: "#e74c3c",
    errorLight: "#fadbd8",
    errorDark: "#a93226",

    info: "#17a2b8",
    infoLight: "#d6edf0",
    infoDark: "#138496",

    pending: "#f39c12",
    active: "#27ae60",
    inactive: "#6c757d",
    disabled: "#adb5bd",
  },

  // Border Colors
  border: {
    primary: "#e9ecef",
    secondary: "#dee2e6",
    focus: "#3498db",
    error: "#e74c3c",
    success: "#27ae60",
    warning: "#f39c12",
  },

  // Shadow Colors
  shadow: {
    sm: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
    md: "0 4px 6px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)",
  },

  // Card Brand Colors
  brands: {
    visa: "#1a1f71",
    mastercard: "#ff5f00",
    amex: "#006fcf",
    discover: "#ff6000",
    paypal: "#0070ba",
    stripe: "#6772e5",
    apple: "#000000",
    google: "#4285f4",
  },

  // Chart Colors
  chart: {
    earning: "#3498db",
    expense: "#e74c3c",
    balance: "#27ae60",
    trend: "#9b59b6",
    grid: "#ecf0f1",
    axis: "#6c757d",
  },

  // Utility Colors
  utility: {
    white: "#ffffff",
    black: "#000000",
    transparent: "transparent",
    current: "currentColor",
  },
};

export const darkTheme = {
  // Primary Colors
  primary: "#3498db",
  primaryHover: "#5dade2",
  primaryLight: "#1e3a8a",
  primaryDark: "#2563eb",

  // Secondary Colors
  secondary: "#ecf0f1",
  secondaryHover: "#ffffff",
  secondaryLight: "#2c3e50",
  secondaryDark: "#ffffff",

neutral: {
  base: "#2d3748",
  light: "#4a5568",
  lighter: "#718096",
  dark: "#1a202c",
  darker: "#171923",
  border: "#4a5568",
  hover: "#3b4252",
  disabled: "#2d3748",
},

  // Background Colors
  background: {
    primary: "#1a202c",
    secondary: "#2d3748",
    tertiary: "#4a5568",
    card: "#2d3748",
    sidebar: "#1a202c",
    overlay: "rgba(0, 0, 0, 0.7)",
  },

  // Text Colors
  text: {
    primary: "#f7fafc",
    secondary: "#e2e8f0",
    tertiary: "#a0aec0",
    inverse: "#1a202c",
    muted: "#718096",
    placeholder: "#4a5568",
  },

  // Status Colors
  status: {
    success: "#38a169",
    successLight: "#276749",
    successDark: "#48bb78",

    warning: "#ed8936",
    warningLight: "#975a16",
    warningDark: "#f6ad55",

    error: "#e53e3e",
    errorLight: "#9b2c2c",
    errorDark: "#f56565",

    info: "#3182ce",
    infoLight: "#2a69ac",
    infoDark: "#63b3ed",

    pending: "#ed8936",
    active: "#38a169",
    inactive: "#718096",
    disabled: "#4a5568",
  },

  // Border Colors
  border: {
    primary: "#4a5568",
    secondary: "#2d3748",
    focus: "#3498db",
    error: "#e53e3e",
    success: "#38a169",
    warning: "#ed8936",
  },

  // Shadow Colors
  shadow: {
    sm: "0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)",
    md: "0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.3), 0 10px 10px rgba(0, 0, 0, 0.1)",
  },

  // Card Brand Colors (same as light theme)
  brands: {
    visa: "#1a1f71",
    mastercard: "#ff5f00",
    amex: "#006fcf",
    discover: "#ff6000",
    paypal: "#0070ba",
    stripe: "#6772e5",
    apple: "#000000",
    google: "#4285f4",
  },

  // Chart Colors
  chart: {
    earning: "#63b3ed",
    expense: "#f56565",
    balance: "#68d391",
    trend: "#b794f6",
    grid: "#4a5568",
    axis: "#a0aec0",
  },

  // Utility Colors
  utility: {
    white: "#ffffff",
    black: "#000000",
    transparent: "transparent",
    current: "currentColor",
  },
};
