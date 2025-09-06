import FuelRequestFlow from "./components/FuelRequestFlow";
import { useParams } from "react-router-dom";

const App = () => {
  const { alertId } = useParams<{ alertId: string }>();
  
  // Convert to number and validate
  const numericAlertId = alertId ? Number(alertId) : null;
  
  if (!alertId || !numericAlertId || isNaN(numericAlertId)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Alert ID</h2>
          <p className="text-gray-600">
            Please provide a valid alert ID in the URL: /alert/[alertId]
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Current URL parameter: {alertId || 'missing'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-8">
          Fuel Management Dashboard - Alert #{numericAlertId}
        </h1>
        <FuelRequestFlow alertId={numericAlertId} />
      </div>
    </div>
  );
};

export default App;