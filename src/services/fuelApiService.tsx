// services/fuelApiService.ts
import axios from 'axios';
import type { FuelLog, GpsFuel, AlertContext, MergedFuelData } from '../types/fuelTypes';

const ENDPOINTS = {
  ACCEPT_ALERT: (alertId: number) =>
    `http://localhost:5001/api/v1/ambulance/fuel/alert/${alertId}`,
  FUEL_LOGS: (alertId: number) =>
    `http://localhost:5001/api/v1/ambulance/fuel/record/${alertId}`,
  SUBMIT_DECISION: "http://localhost:5001/api/v1/ambulance/fuel/record/dashboard/confirm",
};

class FuelApiService {
  async acceptAlert(alertId: number): Promise<AlertContext> {
    const res = await axios.get(ENDPOINTS.ACCEPT_ALERT(alertId));
    if (res.status !== 200) throw new Error("Accept alert failed");

    const alert = res.data.data?.[0]; // backend returns array
    return {
      alertId: alertId, // store alertId for later use
      ambulanceId: alert?.id, // this is the alert ID from your response
      sysServiceId: alert?.sys_service_id,
      ambulanceNumber: alert?.vehicleno,
    };
  }

  async getFuelLogs(): Promise<FuelLog[]> {
    const res = await axios.get(ENDPOINTS.FUEL_LOGS());
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
    // Get alert context first to get sys_service_id and vehicle info
    const alertContext = await this.acceptAlert(alertId);
    
    // Get fuel logs (all logs, then filter if needed)
    const fuelLogs = await this.getFuelLogs();
    
    // Filter fuel logs for this specific vehicle/ambulance if needed
    // Since we only have vehicleno from alert, we'll take the first log for now
    // You might need to filter by ambulanceNumber if multiple vehicles
    const relevantLog = fuelLogs.find(log => 
      log.ambulance?.ambulanceNumber === alertContext.ambulanceNumber
    ) || fuelLogs[0];

    if (!relevantLog) {
      throw new Error("No fuel logs found for this vehicle");
    }

    // Get GPS data using sys_service_id from alert
    const gpsData = await this.getGpsFuelPoints(String(alertContext.sysServiceId));

    const latestGps = gpsData[gpsData.length - 1];
    const softwareReading = Number(relevantLog.softwareReadingLitres);
    const gpsReading = latestGps?.filling || 0;
    
    const difference = softwareReading > 0 
      ? ((softwareReading - gpsReading) / softwareReading) * 100 
      : 0;

    return {
      alertId: alertId,
      ambulanceId: alertContext.ambulanceId, // This is actually alert.id
      sysServiceId: alertContext.sysServiceId,
      ambulanceNumber: alertContext.ambulanceNumber,
      location: relevantLog.location,
      softwareReading: softwareReading,
      gpsFilling: gpsReading,
      difference: difference.toFixed(2) + "%",
      amount: relevantLog.softwareReadingTotalAmount || "0",
      invoiceUrl: relevantLog.invoiceFileUrl,
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