import React, { useState } from 'react';
import { Pill } from './ui/Pill';
import { fuelUtils } from '../utils/fuelUtils';
import type { AlertContext, FuelLog, SubmitFormData } from '../types/fuelTypes';

interface FuelDataTableProps {
  context: AlertContext;
  logs: FuelLog[];
  softwareReading: number;
  gpsFilling: number;
  diffPct: number;
  status: 'OK' | 'Audit';
  onSubmit: (formData: SubmitFormData) => void;
}

export function FuelDataTable({
  context,
  logs,
  softwareReading,
  gpsFilling,
  diffPct,
  status,
  onSubmit
}: FuelDataTableProps) {
  const [otp, setOtp] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [amount, setAmount] = useState<string>(logs[0]?.softwareReadingTotalAmount || "");

  const handleSubmit = () => {
    if (!otp) {
      alert("Please enter OTP");
      return;
    }
    onSubmit({ otp, payment, amount });
  };

  return (
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
              <div className="text-xs text-gray-500">
                {fuelUtils.formatDateTime(logs[0]?.fuelDateTime)}
              </div>
            </td>
            <td className="px-3 py-3">
              <Pill>{softwareReading} L</Pill>
            </td>
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
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-28 rounded-lg border px-2 py-1 text-sm outline-none focus:ring"
              />
            </td>
            <td className="px-3 py-3">
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
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
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-28 rounded-lg border px-2 py-1 text-sm outline-none focus:ring"
              />
            </td>
            <td className="px-3 py-3">
              {logs[0]?.invoiceFileUrl ? (
                <a
                  href={logs[0].invoiceFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View
                </a>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </td>
            <td className="px-3 py-3">
              <button
                onClick={handleSubmit}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Submit
              </button>
            </td>
            <td className="px-3 py-3">
              <span className={status === "Audit" ? "text-red-600" : "text-emerald-600"}>
                {status}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}