import React from 'react';

interface FieldLabelProps {
  children: React.ReactNode;
}

export function FieldLabel({ children }: FieldLabelProps) {
  return (
    <div className="text-xs uppercase tracking-wide text-gray-500">
      {children}
    </div>
  );
}