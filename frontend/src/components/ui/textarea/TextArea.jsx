import React, { forwardRef } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";

const TextArea = forwardRef(
  (
    {
      placeholder,
      disabled = false,
      error = false,
      success = false,
      rows = 4,
      className = "",
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();

    const baseClasses =
      "w-full border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed resize-y";

    const states = {
      default: `border-[${colors.border.primary}] focus:border-[${colors.border.focus}] focus:ring-[${colors.border.focus}]`,
      error: `border-[${colors.status.error}] focus:border-[${colors.status.error}] focus:ring-[${colors.status.error}]`,
      success: `border-[${colors.status.success}] focus:border-[${colors.status.success}] focus:ring-[${colors.status.success}]`,
    };

    const getState = () => {
      if (error) return "error";
      if (success) return "success";
      return "default";
    };

    const classes = cn(baseClasses, states[getState()], className);

    return (
      <textarea
        ref={ref}
        rows={rows}
        className={classes}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
    );
  }
);

TextArea.displayName = "TextArea";

export default TextArea;
