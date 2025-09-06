import React, { useState, useEffect } from "react";
import axios from "axios";

const FuelAlertManagement = () => {
  const [showPopup, setShowPopup] = useState(true);
  const [alertData, setAlertData] = useState(null);
  const [fuelGraphData, setFuelGraphData] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState(17895);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  // Fetch alert data by ID
  const fetchAlertData = async (alertId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5001/api/v1/ambulance/fuel/alert/${alertId}`
      );
      setAlertData(response.data.data[0]);
      return response.data.data[0];
    } catch (err) {
      setError("Failed to fetch alert data");
      console.error("Error fetching alert data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch fuel graph data
  const fetchFuelGraphData = async (sysServiceId) => {
    try {
      const today = new Date();
      const startdate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 00:00`;
      const enddate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 23:59`;
      
      const url = `https://gtrac.in:8089/trackingDashboard/getAllfueldatagraph?sys_service_id=${sysServiceId}&startdate=${encodeURIComponent(startdate)}&enddate=${encodeURIComponent(enddate)}&TypeFT=1&userid=833193`;
      
      const response = await axios.get(url);
      setFuelGraphData(response.data.list || []);
    } catch (err) {
      setError("Failed to fetch fuel graph data");
      console.error("Error fetching fuel graph data:", err);
    }
  };

  // Fetch fuel records
  const fetchFuelRecords = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/v1/ambulance/fuel/record"
      );
      setFuelRecords(response.data.ambulanceFuelLog || []);
    } catch (err) {
      setError("Failed to fetch fuel records");
      console.error("Error fetching fuel records:", err);
    }
  };

  // Handle accept button click
  const handleAccept = async () => {
    const alertInfo = await fetchAlertData(selectedAlertId);
    if (alertInfo && alertInfo.sys_service_id) {
      await fetchFuelGraphData(alertInfo.sys_service_id);
      await fetchFuelRecords();
      setAccepted(true);
      setShowPopup(false);
    }
  };

  // Handle reject button click
  const handleReject = () => {
    setShowPopup(false);
    // Here you would typically make an API call to update the alert status to rejected
    alert("Alert rejected");
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Fuel Alert Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Fuel Alert</h2>
            <p className="text-gray-600 mb-2">Alert ID: {selectedAlertId}</p>
            <p className="text-gray-600 mb-4">Would you like to accept or reject this fuel alert?</p>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? "Processing..." : "Accept"}
              </button>
              <button
                onClick={handleReject}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
      
      {accepted && alertData && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Alert Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Vehicle Number</p>
              <p className="font-medium">{alertData.vehicleno}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Username</p>
              <p className="font-medium">{alertData.Username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Alert Type</p>
              <p className="font-medium">{alertData.alert_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="font-medium">{formatDate(alertData.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">System Service ID</p>
              <p className="font-medium">{alertData.sys_service_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">
                {alertData.gps_latitude}, {alertData.gps_longitude}
              </p>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Fuel Graph Data</h3>
          {fuelGraphData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b">ID</th>
                    <th className="py-2 px-4 border-b">GPS Time</th>
                    <th className="py-2 px-4 border-b">RV</th>
                    <th className="py-2 px-4 border-b">AV</th>
                    <th className="py-2 px-4 border-b">Filling</th>
                    <th className="py-2 px-4 border-b">Fuel Type</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelGraphData.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-4 border-b">{item.id}</td>
                      <td className="py-2 px-4 border-b">{formatDate(item.gps_time)}</td>
                      <td className="py-2 px-4 border-b">{item.rv}</td>
                      <td className="py-2 px-4 border-b">{item.av}</td>
                      <td className="py-2 px-4 border-b">{item.filling}</td>
                      <td className="py-2 px-4 border-b">{item.fueltype}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No fuel graph data available</p>
          )}
          
          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Fuel Records</h3>
          {fuelRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b">ID</th>
                    <th className="py-2 px-4 border-b">Ambulance Number</th>
                    <th className="py-2 px-4 border-b">Fuel Type</th>
                    <th className="py-2 px-4 border-b">Software Reading (L)</th>
                    <th className="py-2 px-4 border-b">Amount</th>
                    <th className="py-2 px-4 border-b">Date & Time</th>
                    <th className="py-2 px-4 border-b">Location</th>
                    <th className="py-2 px-4 border-b">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="py-2 px-4 border-b">{record.id}</td>
                      <td className="py-2 px-4 border-b">{record.ambulance.ambulanceNumber}</td>
                      <td className="py-2 px-4 border-b">{record.fuelType}</td>
                      <td className="py-2 px-4 border-b">{record.softwareReadingLitres}</td>
                      <td className="py-2 px-4 border-b">{record.softwareReadingTotalAmount}</td>
                      <td className="py-2 px-4 border-b">{record.fuelDateTime}</td>
                      <td className="py-2 px-4 border-b">{record.location}</td>
                      <td className="py-2 px-4 border-b">
                        {record.invoiceFileUrl ? (
                          <a
                            href={record.invoiceFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            View Invoice
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No fuel records available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FuelAlertManagement;