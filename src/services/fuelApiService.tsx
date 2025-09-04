import axios from 'axios';
import type { FuelLog, GpsFuel, AlertContext, MergedFuelData } from '../types/fuelTypes';

const ENDPOINTS = {
  ACCEPT_ALERT: "http://localhost:5001/api/v1/ambulance/fuel/record",
  FUEL_LOGS: (ambulanceId: number) =>
    `http://localhost:5001/api/v1/ambulance/fuel/logs?ambulanceId=${ambulanceId}`,
  GPS_POINTS: (sysServiceId: string | number) =>
    `http://localhost:5001/api/v1/gps/fuel?sys_service_id=${sysServiceId}`,
  SUBMIT_DECISION: "http://localhost:5001/api/v1/ambulance/fuel/record/confirm",
};

class FuelApiService {
  async acceptAlert(): Promise<AlertContext> {
    const res = await fetch(ENDPOINTS.ACCEPT_ALERT);
    if (!res.ok) throw new Error("Accept alert failed");
    const data = await res.json();
    return this.mapAlertToContext(data);
  }

  async getFuelLogs(ambulanceId?: number): Promise<FuelLog[]> {
    const res = await axios.get("http://localhost:5001/api/v1/ambulance/fuel/record/");
    return res.data.ambulanceFuelLog;
  }

  async getGpsFuelPoints(sysServiceId: string): Promise<GpsFuel[]> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    const startdate = `${yyyy}-${mm}-${dd} 00:00`;
    const enddate = `${yyyy}-${mm}-${dd} 23:59`;

    // Using hardcoded URL as per original code
    const url = "https://gtrac.in:8089/trackingDashboard/getAllfueldatagraph?sys_service_id=12449316&startdate=2025-09-02%2000%3A00&enddate=2025-09-02%2023%3A59&TypeFT=1&userid=833193";

    const res = await axios.get(url);
    return res.data.list;
  }

  async getMergedFuelData(): Promise<MergedFuelData> {
    const fuelLogs = await this.getFuelLogs();
    const log = fuelLogs[0]; // pick first record

    const { sysServiceId, ambulanceNumber } = log.ambulance;
    const gpsData = await this.getGpsFuelPoints(sysServiceId);

    const latestGps = gpsData[gpsData.length - 1];
    const difference = ((log.softwareReadingLitres - latestGps.filling) / log.softwareReadingLitres) * 100;

    return {
      ambulanceId: log.ambulanceId,
      sysServiceId,
      ambulanceNumber,
      location: log.location,
      softwareReading: Number(log.softwareReadingLitres),
      gpsFilling: latestGps?.filling || 0,
      difference: difference.toFixed(2) + "%",
      amount: log.softwareReadingTotalAmount || "0",
      invoiceUrl: log.invoiceFileUrl,
      status: Math.abs(difference) > 5 ? "Audit" : "OK",
    };
  }

  async submitFuelDecision(body: any): Promise<any> {
    const res = await fetch(ENDPOINTS.SUBMIT_DECISION, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Submit failed");
    return res.json();
  }

  private mapAlertToContext(data: any): AlertContext {
    const a = data?.data || data?.alert || data || {};
    return {
      ambulanceId: a.ambulanceId ?? 101,
      sysServiceId: a.sysServiceId ?? "12449316",
      ambulanceNumber: a.ambulanceNumber ?? "ITG1100",
    };
  }
}

export const fuelApiService = new FuelApiService();