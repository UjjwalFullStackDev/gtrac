import { useState, useMemo } from "react";
import { FuelRequestCard } from "./FuelRequestCard";
import { FuelDetailsModal } from "./FuelDetailsModal";
import { useFuelData } from "../hooks/useFuelData";
import { fuelApiService } from "../services/fuelApiService";
import type { AlertContext } from "../types/fuelTypes";

export default function FuelRequestFlow() {
  const [showRequest, setShowRequest] = useState(true);
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [context, setContext] = useState<AlertContext | null>(null);
  const [showModal, setShowModal] = useState(false);

  const {
    logs,
    gpsData,
    loadingData,
    refreshData,
    softwareReading,
    gpsFilling,
    diffPct,
    status
  } = useFuelData(context);

  const handleAccept = async () => {
    try {
      setLoadingAccept(true);
      const mergedData = await fuelApiService.getMergedFuelData();
      setContext(mergedData);
      setShowRequest(false);
      setShowModal(true);
      await refreshData(mergedData);
    } catch (error: any) {
      alert(error?.message || "Accept failed");
    } finally {
      setLoadingAccept(false);
    }
  };

  const handleSubmit = async (formData: {
    otp: string;
    payment: string;
    amount: string | number;
  }) => {
    if (!context) return;
    
    const body = {
      ambulanceId: context.ambulanceId,
      sysServiceId: context.sysServiceId,
      ambulanceNumber: context.ambulanceNumber,
      ...formData,
      amount: Number(formData.amount || 0),
      softwareReadingLitres: softwareReading,
      appReadingLitres: gpsFilling,
      fuelDifferencePct: diffPct,
      status,
      invoiceUrl: logs[0]?.invoiceFileUrl || null,
      location: logs[0]?.location || null,
      decidedAt: new Date().toISOString(),
    };

    try {
      await fuelApiService.submitFuelDecision(body);
      alert("Submitted successfully");
      setShowModal(false);
      setContext(null);
    } catch (error: any) {
      alert(error?.message || "Submit failed");
    }
  };

  return (
    <div className="p-4">
      {showRequest && (
        <FuelRequestCard
          onAccept={handleAccept}
          onReject={() => setShowRequest(false)}
          loading={loadingAccept}
        />
      )}

      {showModal && context && (
        <FuelDetailsModal
          context={context}
          logs={logs}
          gpsData={gpsData}
          loadingData={loadingData}
          softwareReading={softwareReading}
          gpsFilling={gpsFilling}
          diffPct={diffPct}
          status={status}
          onClose={() => setShowModal(false)}
          onRefresh={refreshData}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}