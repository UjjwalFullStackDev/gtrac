import { ModalHeader } from './ModalHeader';
import { FuelDataTable } from './FuelDataTable';
import { FuelSummaryCards } from './FuelSummaryCards';
import type { AlertContext, FuelLog, GpsFuel, SubmitFormData } from '../types/fuelTypes';

interface FuelDetailsModalProps {
  context: AlertContext;
  logs: FuelLog[];
  gpsData: GpsFuel[];
  loadingData: boolean;
  softwareReading: number;
  gpsFilling: number;
  diffPct: number;
  status: 'OK' | 'Audit';
  onClose: () => void;
  onRefresh: () => void;
  onSubmit: (formData: SubmitFormData) => void;
}

export function FuelDetailsModal({
  context,
  logs,
  gpsData,
  loadingData,
  softwareReading,
  gpsFilling,
  diffPct,
  status,
  onClose,
  onRefresh,
  onSubmit
}: FuelDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
        <ModalHeader
          context={context}
          loadingData={loadingData}
          onRefresh={onRefresh}
          onClose={onClose}
        />
        
        <div className="p-4">
          <FuelDataTable
            context={context}
            logs={logs}
            softwareReading={softwareReading}
            gpsFilling={gpsFilling}
            diffPct={diffPct}
            status={status}
            onSubmit={onSubmit}
          />

          <FuelSummaryCards
            gpsFilling={gpsFilling}
            softwareReading={softwareReading}
            diffPct={diffPct}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}