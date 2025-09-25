import React, { useState, useEffect, useRef } from "react";
import { X, Maximize2, Minimize2, Loader2 } from "lucide-react";

export default function Modal({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  actions,
  size = "sm", // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fullScreen'
  fullScreen = false,
  showCloseButton = true,
  showFullscreenToggle = false,
  loading = false,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) {
  const [isFullscreen, setIsFullscreen] = useState(fullScreen);
  const modalRef = useRef(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeMap = {
    xs: "max-w-xs",
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    fullScreen: "w-screen h-screen max-w-none",
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 duration-200 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`
          relative bg-surface border border-default rounded-2xl shadow-2xl 
          overflow-hidden transition-all duration-300 ease-out w-full
          animate-in zoom-in-95 slide-in-from-bottom-2
          ${
            isFullscreen
              ? "w-screen h-screen max-w-none rounded-none border-0"
              : `${sizeMap[size]} max-h-[calc(100vh-2rem)]`
          }
        `}
      >
        {/* Header */}
        {(title || subtitle || showCloseButton || showFullscreenToggle) && (
          <div className="relative flex items-start justify-between p-6 border-b border-light">
            <div className="flex-1 min-w-0 pr-4">
              {title && (
                <h2 className="text-xl font-semibold leading-tight text-primary-text">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-2 text-sm leading-relaxed text-secondary-text">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {showFullscreenToggle && (
                <button
                  onClick={handleToggleFullscreen}
                  className="p-2 transition-all duration-200 ease-in-out rounded-lg text-secondary-text hover:bg-background hover:text-primary-text focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              )}

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 transition-all duration-200 ease-in-out rounded-lg text-secondary-text hover:bg-danger/10 hover:text-danger focus:outline-none focus:ring-2 focus:ring-danger/20"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div
          className={`
            overflow-y-auto scrollbar-thin scrollbar-track-transparent 
            scrollbar-thumb-border hover:scrollbar-thumb-primary/20
            ${isFullscreen ? "flex-1" : "max-h-[calc(100vh-12rem)]"}
          `}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <Loader2 className="w-8 h-8 mb-4 text-primary animate-spin" />
              <span className="text-sm text-secondary-text">Loading...</span>
            </div>
          ) : (
            <div className="p-6">{children}</div>
          )}
        </div>

        {/* Footer Actions */}
        {actions && (
          <div className="flex flex-wrap items-center justify-end gap-3 p-6 border-t border-light bg-background/50">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
