import React from "react";
import { cn } from "../../../utils/cn";
import { useTheme } from "../../../contexts/ThemeContext";

const Form = ({ children, onSubmit, className = "", ...props }) => {
  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} {...props}>
      {children}
    </form>
  );
};

/* Group wrapper */
const FormGroup = ({ children, className = "" }) => (
  <div className={cn("space-y-2", className)}>{children}</div>
);

/* Label */
const FormLabel = ({ children, required = false, className = "", htmlFor }) => {
  const { colors } = useTheme();
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm font-medium", className)}
      style={{ color: colors.text.primary }}
    >
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
};

/* Error message */
const FormError = ({ children, className = "" }) => {
  if (!children) return null;
  return (
    <p className={cn("text-sm flex items-center", className, "text-red-600")}>
      <svg
        className="w-4 h-4 mr-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {children}
    </p>
  );
};

/* Help text */
const FormHelp = ({ children, className = "" }) => {
  if (!children) return null;
  const { colors } = useTheme();
  return (
    <p
      className={cn("text-sm", className)}
      style={{ color: colors.text.secondary }}
    >
      {children}
    </p>
  );
};

/* Success message */
const FormSuccess = ({ children, className = "" }) => {
  if (!children) return null;
  return (
    <p className={cn("text-sm flex items-center text-green-600", className)}>
      <svg
        className="w-4 h-4 mr-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {children}
    </p>
  );
};

/* Input group (prepend/append) */
const InputGroup = ({ children, className = "" }) => {
  return (
    <div className={cn("flex", className)}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;

        let additionalClasses = "";
        if (isFirst && !isLast) {
          additionalClasses = "rounded-r-none border-r-0";
        } else if (isLast && !isFirst) {
          additionalClasses = "rounded-l-none";
        } else if (!isFirst && !isLast) {
          additionalClasses = "rounded-none border-r-0";
        }

        return React.cloneElement(child, {
          className: cn(child.props.className, additionalClasses),
        });
      })}
    </div>
  );
};

/* Input group text */
const InputGroupText = ({ children, className = "" }) => {
  const { colors } = useTheme();
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 text-sm border rounded-md",
        className
      )}
      style={{
        background: colors.background.secondary,
        borderColor: colors.border.primary,
        color: colors.text.secondary,
      }}
    >
      {children}
    </span>
  );
};

/* Textarea */
const Textarea = React.forwardRef(
  (
    {
      rows = 3,
      resize = "vertical",
      error = false,
      success = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();

    const baseClasses =
      "w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
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
      resizeClasses[resize],
      states[getState()],
      className
    );

    return <textarea ref={ref} rows={rows} className={classes} {...props} />;
  }
);

Textarea.displayName = "Textarea";

/* Attach subcomponents */
Form.Group = FormGroup;
Form.Label = FormLabel;
Form.Error = FormError;
Form.Help = FormHelp;
Form.Success = FormSuccess;
Form.InputGroup = InputGroup;
Form.InputGroupText = InputGroupText;
Form.Textarea = Textarea;

export default Form;
