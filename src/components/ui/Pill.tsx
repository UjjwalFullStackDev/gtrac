import React from "react";

interface PillProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export function Pill({ children, variant = "default" }: PillProps) {
  const variantClasses: Record<string, string> = {
    default: "bg-gray-200 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
