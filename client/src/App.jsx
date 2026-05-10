import { Toaster } from "react-hot-toast";
import Dashboard from "./components/Dashboard";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Dashboard />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#e2e8f0",
            border: "1px solid #334155"
          }
        }}
      />
    </div>
  );
}
