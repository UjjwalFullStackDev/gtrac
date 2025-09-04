import type { AlertContext } from '../types/fuelTypes';

interface ModalHeaderProps {
  context: AlertContext;
  loadingData: boolean;
  onRefresh: () => void;
  onClose: () => void;
}

export function ModalHeader({ context, loadingData, onRefresh, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="space-y-0.5">
        <div className="text-sm text-gray-500">Ambulance Fueling</div>
        <div className="text-lg font-semibold">Vehicle: {context.ambulanceNumber}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={loadingData}
          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {loadingData ? "Refreshing..." : "Refresh"}
        </button>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}