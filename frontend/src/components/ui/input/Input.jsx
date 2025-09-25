import React, { forwardRef } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { cn } from "../../../utils/cn";

const Input = forwardRef(
  (
    {
      type = "text",
      placeholder,
      disabled = false,
      error = false,
      success = false,
      size = "md",
      className = "",
      icon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();

    const baseClasses =
      "w-full border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base",
    };

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

    const classes = cn(
      baseClasses,
      sizes[size],
      states[getState()],
      icon && "pl-10",
      rightIcon && "pr-10",
      className
    );

    if (icon || rightIcon) {
      return (
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-secondary-text">
              <div className="w-5 h-5">{icon}</div>
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={classes}
            placeholder={placeholder}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-secondary-text">
              <div className="w-5 h-5">{rightIcon}</div>
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        type={type}
        className={classes}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
