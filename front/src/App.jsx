import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navigation from "./components/Navigation";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import VehiclesPage from "./components/VehiclesPage";
import EmergencyContactsPage from "./components/EmergencyContactsPage";
import PersonalInfoPage from "./components/PersonalInfoPage";
import InsurancePage from "./components/Insurance"; 
import AdminVehiclesPage from "./components/AdminVehiclesPage";
import UsersPage from "./components/UsersPage";
const MainApp = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <LoginScreen />;

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard setCurrentPage={setCurrentPage}  />;
      case "vehicles":
        return <VehiclesPage />;
      case "emergency-contacts":
        return <EmergencyContactsPage />;
      case "personal-info":
        return <PersonalInfoPage />;
      case "insurance":
          return <InsurancePage />;
      case "all-vehicles":
            return <AdminVehiclesPage />;
      case "all-users":
            return <UsersPage />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <MainApp />
  </AuthProvider>
);

export default App;
