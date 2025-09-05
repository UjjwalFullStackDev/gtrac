// components/FuelRequestCard.tsx
import React from 'react';

interface FuelRequestCardProps {
  onAccept: () => void;
  onReject: () => void;
  loading: boolean;
  alertId: number;
}

export function FuelRequestCard({ onAccept, onReject, loading, alertId }: FuelRequestCardProps) {
  return (
    <div className="max-w-md rounded-2xl border bg-white p-4 shadow">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-orange-100 flex items-center justify-center">
          🛢️
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Ambulance Fueling</h3>
            <span className="text-xs font-semibold">Alert #{alertId}</span>
          </div>
          <div className="text-sm text-gray-500">Request • Ambulance Fueling</div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onAccept}
              disabled={loading}
              className="rounded-xl border border-emerald-300 bg-emerald-500/90 px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Opening..." : "Accept"}
            </button>
            <button
              onClick={onReject}
              className="rounded-xl border px-4 py-2 text-red-500 hover:bg-red-50"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}