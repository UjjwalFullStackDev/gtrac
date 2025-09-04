import { FieldLabel } from './ui/FieldLabel';

interface FuelSummaryCardsProps {
  gpsFilling: number;
  softwareReading: number;
  diffPct: number;
  status: 'OK' | 'Audit';
}

export function FuelSummaryCards({
  gpsFilling,
  softwareReading,
  diffPct,
  status
}: FuelSummaryCardsProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="rounded-xl border p-3">
        <FieldLabel>GPS Latest Fill</FieldLabel>
        <div className="text-sm">{gpsFilling || 0} L</div>
      </div>
      <div className="rounded-xl border p-3">
        <FieldLabel>Software Reading</FieldLabel>
        <div className="text-sm">{softwareReading || 0} L</div>
      </div>
      <div className="rounded-xl border p-3">
        <FieldLabel>Difference</FieldLabel>
        <div className="text-sm">{diffPct}%</div>
      </div>
      <div className="rounded-xl border p-3">
        <FieldLabel>Status</FieldLabel>
        <div className={
          "text-sm font-medium " + 
          (status === "Audit" ? "text-red-600" : "text-emerald-600")
        }>
          {status}
        </div>
      </div>
    </div>
  );
}