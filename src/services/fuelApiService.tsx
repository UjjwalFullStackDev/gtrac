// services/fuelApiService.ts
import axios from 'axios';
import type { FuelLog, GpsFuel, AlertContext, MergedFuelData } from '../types/fuelTypes';

const ENDPOINTS = {
  ACCEPT_ALERT: (alertId: number) =>
    `http://localhost:5001/api/v1/ambulance/fuel/alert/${alertId}`,
  FUEL_LOGS: (alertId: number) =>
    `http://localhost:5001/api/v1/ambulance/fuel/record/alert/${alertId}`,
  GPS_POINTS: (sysServiceId: string | number) =>
    `http://localhost:5001/api/v1/gps/fuel?sys_service_id=${sysServiceId}`,
  SUBMIT_DECISION: "http://localhost:5001/api/v1/ambulance/fuel/record/dashboard/confirm",
};

class FuelApiService {
  async acceptAlert(alertId: number): Promise<AlertContext> {
    const res = await axios.get(ENDPOINTS.ACCEPT_ALERT(alertId));
    if (res.status !== 200) throw new Error("Accept alert failed");

    const alert = res.data.data?.[0]; // backend returns array
    return {
      alertId: alertId, // store alertId for later use
      ambulanceId: alert?.id, // careful: this is alert.id, not ambulanceId!
      sysServiceId: alert?.sys_service_id,
      ambulanceNumber: alert?.vehicleno,
    };
  }

  async getFuelLogs(alertId: number): Promise<FuelLog[]> {
    const res = await axios.get(ENDPOINTS.FUEL_LOGS(alertId));
    return res.data.ambulanceFuelLog;
  }

  async getGpsFuelPoints(sysServiceId: string): Promise<GpsFuel[]> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    const startdate = `${yyyy}-${mm}-${dd} 00:00`;
    const enddate = `${yyyy}-${mm}-${dd} 23:59`;

    const url = `https://gtrac.in:8089/trackingDashboard/getAllfueldatagraph?sys_service_id=${sysServiceId}&startdate=${encodeURIComponent(
      startdate
    )}&enddate=${encodeURIComponent(enddate)}&TypeFT=1&userid=833193`;

    const res = await axios.get(url);
    return res.data.list;
  }

  async getMergedFuelData(alertId: number): Promise<MergedFuelData> {
    const fuelLogs = await this.getFuelLogs(alertId);
    const log = fuelLogs[0]; // pick first record

    const { sysServiceId, ambulanceNumber } = log.ambulance;
    const gpsData = await this.getGpsFuelPoints(sysServiceId);

    const latestGps = gpsData[gpsData.length - 1];
    const difference = ((Number(log.softwareReadingLitres) - latestGps.filling) / Number(log.softwareReadingLitres)) * 100;

    return {
      alertId: alertId,
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
    try {
      const res = await axios.post(ENDPOINTS.SUBMIT_DECISION, body, {
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    } catch (error) {
      throw new Error("Submit failed: " + (error as Error).message);
    }
  }
}

export const fuelApiService = new FuelApiService();