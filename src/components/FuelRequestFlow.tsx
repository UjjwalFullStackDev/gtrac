// FuelRequestFlow.tsx - Main Component
import React, { useState, useMemo } from "react";
import { FuelRequestCard } from "./FuelRequestCard";
import { FuelDetailsModal } from "./FuelDetailsModal";
import { useFuelData } from "../hooks/useFuelData";
import { fuelApiService } from "../services/fuelApiService";
import type { AlertContext } from "../types/fuelTypes";

interface FuelRequestFlowProps {
  alertId: number; // Pass alertId as prop from parent component
}

export default function FuelRequestFlow({ alertId }: FuelRequestFlowProps) {
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
      // Get context data first
      const contextData = await fuelApiService.acceptAlert(alertId);
      setContext(contextData);
      
      // Get merged fuel data
      const mergedData = await fuelApiService.getMergedFuelData(alertId);
      
      setShowRequest(false);
      setShowModal(true);
      
      // Refresh data with context
      await refreshData(contextData, alertId);
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
      alertId: context.alertId,
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
          alertId={alertId}
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
          onRefresh={() => refreshData(context, alertId)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}