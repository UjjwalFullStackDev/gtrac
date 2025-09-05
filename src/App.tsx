import FuelRequestFlow from "./components/FuelRequestFlow";
import { useParams } from "react-router-dom";

const App = () => {

  const { alertId } = useParams<{ alertId: string }>();
  if (!alertId) {
    return <div>Alert ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-8">
          Fuel Management Dashboard
        </h1>
        <FuelRequestFlow alertId={Number(alertId)} />
      </div>
    </div>
  );
};

export default App;
