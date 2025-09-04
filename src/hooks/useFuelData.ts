// hooks/useFuelData.ts
import { useState, useEffect, useMemo } from 'react';
import { fuelApiService } from '../services/fuelApiService';
import { fuelUtils } from '../utils/fuelUtils';
import type { FuelLog, GpsFuel, AlertContext } from '../types/fuelTypes';

export function useFuelData(context: AlertContext | null) {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [gpsData, setGpsData] = useState<GpsFuel[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const softwareReading = useMemo(() => {
    const latest = [...logs].sort((a, b) => 
      new Date(b.fuelDateTime).getTime() - new Date(a.fuelDateTime).getTime()
    )[0];
    return latest ? Number(latest.softwareReadingLitres || 0) : 0;
  }, [logs]);

  const gpsFilling = useMemo(() => {
    const latestFilling = fuelUtils.pickLatestFilling(gpsData);
    return latestFilling?.filling ? Number(latestFilling.filling) : 0;
  }, [gpsData]);

  const diffPct = useMemo(() => 
    fuelUtils.calculateDifferencePct(softwareReading, gpsFilling), 
    [softwareReading, gpsFilling]
  );

  const status = useMemo(() => 
    fuelUtils.statusFromDiff(diffPct), 
    [diffPct]
  );

  const refreshData = async (ctx = context) => {
    if (!ctx) return;
    
    setLoadingData(true);
    try {
      const [fuelLogs, gpsPoints] = await Promise.all([
        fuelApiService.getFuelLogs(ctx.ambulanceId),
        fuelApiService.getGpsFuelPoints(String(ctx.sysServiceId)),
      ]);
      setLogs(fuelLogs ?? []);
      setGpsData(gpsPoints ?? []);
    } catch (error: any) {
      alert(error?.message || "Data fetch error");
    } finally {
      setLoadingData(false);
    }
  };

  return {
    logs,
    gpsData,
    loadingData,
    refreshData,
    softwareReading,
    gpsFilling,
    diffPct,
    status,
  };
}