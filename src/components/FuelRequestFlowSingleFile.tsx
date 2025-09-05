import React, { useEffect, useMemo, useState } from "react";
import axios from 'axios';

/**
 * Fuel Request → Audit Flow (single-file React + Tailwind)
 *
 * Drop this component anywhere in your dashboard. It shows a Request card.
 * On Accept → opens a Fuel Details modal that fetches/merges your two APIs and
 * lets the operator enter OTP, payment, amount, then Submit.
 *
 * ✅ What you MUST edit:
 *  1) ENDPOINTS.* below to match your backend routes
 *  2) mapAlertToContext(...) if your Accept API returns a different payload
 *  3) getFuelLogs(...) & getGpsFuelPoints(...) to match your query params
 *  4) postSubmitFuelDecision(...) endpoint & JSON body as per your backend
 *
 * Notes:
 * - Uses only fetch + Tailwind (no external UI libs).
 * - TypeScript-friendly typings are inline via JSDoc to keep single-file.
 */

// ======= CONFIG =======
const ENDPOINTS = {
  // called when operator clicks Accept on the request card
  ACCEPT_ALERT: "http://localhost:5001/api/v1/ambulance/fuel/record",

  // GET fuel logs (your API 1). Example you gave returns an array under `ambulanceFuelLog`.
  FUEL_LOGS: (ambulanceId: number) =>
    `http://localhost:5001/api/v1/ambulance/fuel/logs?ambulanceId=${ambulanceId}`,

  // GET gps fuel graph (your API 2). Query by sys_service_id
  GPS_POINTS: (sysServiceId: string | number) =>
    `http://localhost:5001/api/v1/gps/fuel?sys_service_id=${sysServiceId}`,

  // POST final decision (store otp, payment, etc.) — placeholder, adjust!
  SUBMIT_DECISION: "http://localhost:5001/api/v1/ambulance/fuel/record/confirm",
};

const DIFFERENCE_THRESHOLD_PCT = 5; // % over which status becomes "Audit"

// ======= TYPES (JSDoc so file stays .tsx-compatible without imports) =======
/** @typedef {{ id:number, ambulanceId:number, invoiceFileUrl:string, fuelType:string, softwareReadingLitres:string, softwareReadingTotalAmount?:string, manualReadingLitres?:string, fuelDateTime:string, location:string, ambulance:{ id:number, sysServiceId:string, ambulanceNumber:string } }} FuelLog */
/** @typedef {{ id:number, sys_service_id:number, gps_time:string, rec_time:string, rv:number, av:number, timeinepoc:number, gps_latitude:string, gps_longitude:string, filling:number, fillingtheftaddress:string, fueltype:string }} GpsFuel */
/** @typedef {{ ambulanceId:number, sysServiceId:string|number, ambulanceNumber:string }} AlertContext */

// ======= HELPERS =======
function formatDateTime(dt?: string) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    return d.toLocaleString();
  } catch {
    return dt;
  }
}

function calculateDifferencePct(software: number, app: number) {
  if (!isFinite(software) || software <= 0) return 0;
  const diff = Math.abs(software - app);
  return +(diff / software * 100).toFixed(2);
}

function statusFromDiff(pct: number) {
  return pct > DIFFERENCE_THRESHOLD_PCT ? "Audit" : "OK";
}

// Pick the most recent GPS point that indicates a filling event
function pickLatestFilling(points: GpsFuel[]): GpsFuel | undefined {
  return [...points]
    .filter(p => (p.filling && p.filling > 0) || /filling/i.test(p.fueltype || ""))
    .sort((a,b) => new Date(b.gps_time).getTime() - new Date(a.gps_time).getTime())[0];
}

// ======= API CALLS (adjust to your backend) =======
async function callAcceptAlert(): Promise<AlertContext> {
  const res = await fetch(ENDPOINTS.ACCEPT_ALERT);
  if (!res.ok) throw new Error("Accept alert failed");
  const data = await res.json();
  return mapAlertToContext(data);
}

function mapAlertToContext(data: any): AlertContext {
  // Try to read from the most likely shapes. Adjust for your real response.
  // Fallback to mock for dev.
  const a = data?.data || data?.alert || data || {};
  return {
    ambulanceId: a.ambulanceId ?? 101,
    sysServiceId: a.sysServiceId ?? "12449316",
    ambulanceNumber: a.ambulanceNumber ?? "ITG1100",
  };
}

async function getFuelLogs() {
  const res = await axios.get("http://localhost:5001/api/v1/ambulance/fuel/record/");
  return res.data.ambulanceFuelLog;
}


async function getGpsFuelPoints(sys_service_id: string) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  const startdate = `${yyyy}-${mm}-${dd} 00:00`;
  const enddate = `${yyyy}-${mm}-${dd} 23:59`;

  const url = `https://gtrac.in:8089/trackingDashboard/getAllfueldatagraph?sys_service_id=${sys_service_id}&startdate=${encodeURIComponent(startdate)}&enddate=${encodeURIComponent(enddate)}&TypeFT=1&userid=833193`;
  // const url = "https://gtrac.in:8089/trackingDashboard/getAllfueldatagraph?sys_service_id=12449316&startdate=2025-09-02%2000%3A00&enddate=2025-09-02%2023%3A59&TypeFT=1&userid=833193";

  const res = await axios.get(url);
  console.log(res.data)
  return res.data.list;
}


// Merge both APIs
async function getMergedFuelData() {
  const fuelLogs = await getFuelLogs();
  const log = fuelLogs[0]; // pick first record (or based on popup selection)

  const { sysServiceId, ambulanceNumber } = log.ambulance;
  const gpsData = await getGpsFuelPoints(sysServiceId);

  const latestGps = gpsData[gpsData.length - 1]; // pick latest filling

  const difference =
    ((log.softwareReadingLitres - latestGps.filling) / log.softwareReadingLitres) * 100;

  return {
    ambulanceNumber,
    location: log.location,
    softwareReading: log.softwareReadingLitres,
    gpsFilling: latestGps?.filling || 0,
    difference: difference.toFixed(2) + "%",
    amount: log.softwareReadingTotalAmount,
    invoiceUrl: log.invoiceFileUrl,
    status: Math.abs(difference) > 5 ? "Audit" : "OK",
  };
}

async function postSubmitFuelDecision(body: any) {
  const res = await fetch(ENDPOINTS.SUBMIT_DECISION, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Submit failed");
  return res.json();
}

// ======= UI PARTS =======
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-wide text-gray-500">{children}</div>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}

// ======= MAIN COMPONENT =======
export default function FuelRequestFlow() {
  const [showRequest, setShowRequest] = useState(true);
  const [loadingAccept, setLoadingAccept] = useState(false);

  const [context, setContext] = useState<AlertContext | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [gps, setGps] = useState<GpsFuel[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [otp, setOtp] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [amount, setAmount] = useState<string | number>("");

  const softwareReading = useMemo(() => {
    // choose the most recent fuel log
    const latest = [...logs].sort((a,b) => new Date(b.fuelDateTime).getTime() - new Date(a.fuelDateTime).getTime())[0];
    if (!latest) return 0;
    // prefill amount & return litres
    if (latest.softwareReadingTotalAmount) setAmount(latest.softwareReadingTotalAmount);
    return Number(latest.softwareReadingLitres || 0);
  }, [logs]);

  const gpsFilling = useMemo(() => {
    const p = pickLatestFilling(gps);
    return p?.filling ? Number(p.filling) : 0;
  }, [gps]);

  const diffPct = useMemo(() => calculateDifferencePct(softwareReading, gpsFilling), [softwareReading, gpsFilling]);
  const status = useMemo(() => statusFromDiff(diffPct), [diffPct]);

  async function onAccept() {
    try {
      setLoadingAccept(true);
      const ctx = await getMergedFuelData();
      setContext(ctx);
      setShowRequest(false);
      setShowModal(true);
      await refreshData(ctx);
    } catch (e:any) {
      alert(e?.message || "Accept failed");
    } finally {
      setLoadingAccept(false);
    }
  }

  async function refreshData(ctx = context!) {
    if (!ctx) return;
    setLoadingData(true);
    try {
      const [l, g] = await Promise.all([
        getFuelLogs(ctx.ambulanceId),
        getGpsFuelPoints(ctx.sysServiceId),
      ]);
      setLogs(l ?? []);
      setGps(g ?? []);
    } catch (e:any) {
      alert(e?.message || "Data fetch error");
    } finally {
      setLoadingData(false);
    }
  }

  async function onSubmit() {
    if (!context) return;
    if (!otp) return alert("Please enter OTP");
    const body = {
      ambulanceId: context.ambulanceId,
      sysServiceId: context.sysServiceId,
      ambulanceNumber: context.ambulanceNumber,
      otp,
      modeOfPayment: payment,
      amount: Number(amount || 0),
      softwareReadingLitres: softwareReading,
      appReadingLitres: gpsFilling,
      fuelDifferencePct: diffPct,
      status,
      // you may also send invoiceUrl & location from the newest fuel log
      invoiceUrl: logs[0]?.invoiceFileUrl || null,
      location: logs[0]?.location || null,
      decidedAt: new Date().toISOString(),
    };

    try {
      await postSubmitFuelDecision(body);
      alert("Submitted successfully");
      setShowModal(false);
      setContext(null);
    } catch (e:any) {
      alert(e?.message || "Submit failed");
    }
  }

  return (
    <div className="p-4">
      {/* REQUEST CARD */}
      {showRequest && (
        <div className="max-w-md rounded-2xl border bg-white p-4 shadow">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-orange-100 flex items-center justify-center">🛢️</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Ambulance Fueling</h3>
                <span className="text-xs font-semibold">ITG1100</span>
              </div>
              <div className="text-sm text-gray-500">Request • Ambulance Fueling</div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={onAccept}
                  disabled={loadingAccept}
                  className="rounded-xl border border-emerald-300 bg-emerald-500/90 px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
                >
                  {loadingAccept ? "Opening..." : "Accept"}
                </button>
                <button className="rounded-xl border px-4 py-2 text-red-500 hover:bg-red-50">Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && context && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="space-y-0.5">
                <div className="text-sm text-gray-500">Ambulance Fueling</div>
                <div className="text-lg font-semibold">Vehicle: {context.ambulanceNumber}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refreshData()}
                  disabled={loadingData}
                  className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                >{loadingData ? "Refreshing..." : "Refresh"}</button>
                <button onClick={() => setShowModal(false)} className="rounded-full p-2 hover:bg-gray-100">✕</button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-sm text-gray-500">
                      <th className="px-3">Vehicle & Driver</th>
                      <th className="px-3">Location</th>
                      <th className="px-3">Current Status</th>
                      <th className="px-3">Soft Reading</th>
                      <th className="px-3">App Reading</th>
                      <th className="px-3">Fuel Difference</th>
                      <th className="px-3">OTP</th>
                      <th className="px-3">Mode of Payment</th>
                      <th className="px-3">Amount</th>
                      <th className="px-3">Invoice</th>
                      <th className="px-3">Action</th>
                      <th className="px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="rounded-xl bg-gray-50 align-top">
                      <td className="px-3 py-3">
                        <div className="font-medium">{context.ambulanceNumber}</div>
                        <div className="text-xs text-gray-500">Driver: —</div>
                      </td>
                      <td className="px-3 py-3 max-w-[220px]">
                        <div className="text-sm">{logs[0]?.location || "-"}</div>
                        <div className="text-xs text-gray-500">{formatDateTime(logs[0]?.fuelDateTime)}</div>
                      </td>
                      <td className="px-3 py-3"><Pill>{softwareReading} L</Pill></td>
                      <td className="px-3 py-3">{softwareReading || "-"}</td>
                      <td className="px-3 py-3">{gpsFilling || "-"}</td>
                      <td className="px-3 py-3">
                        <span className={
                          "font-medium " + (status === "Audit" ? "text-red-600" : "text-emerald-600")
                        }>
                          {diffPct}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                          placeholder="Enter OTP"
                          className="w-28 rounded-lg border px-2 py-1 text-sm outline-none focus:ring"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={payment}
                          onChange={e => setPayment(e.target.value)}
                          className="w-36 rounded-lg border px-2 py-1 text-sm outline-none focus:ring"
                        >
                          <option>Cash</option>
                          <option>UPI</option>
                          <option>Card</option>
                          <option>Online</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-28 rounded-lg border px-2 py-1 text-sm outline-none focus:ring"
                        />
                      </td>
                      <td className="px-3 py-3">
                        {logs[0]?.invoiceFileUrl ? (
                          <a href={logs[0].invoiceFileUrl} target="_blank" className="text-blue-600 underline">View</a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={onSubmit}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                        >Submit</button>
                      </td>
                      <td className="px-3 py-3">
                        <span className={status === "Audit" ? "text-red-600" : "text-emerald-600"}>{status}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Extras: mini-cards */}
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
                  <div className={"text-sm font-medium " + (status === "Audit" ? "text-red-600" : "text-emerald-600")}>{status}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
