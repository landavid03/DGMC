import React from "react";
import {
  Home,
  Car,
  Phone,
  Motorbike,
  Shield,
  User,
  FileText,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navigation = ({
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    const base = [
      {
        id: "dashboard",
        label: "Inicio",
        icon: Home,
        roles: ["admin", "monitor", "user"],
      },
      {
        id: "vehicles",
        label: "Mis motos",
        icon: Motorbike,
        roles: ["user", "admin", "monitor"]
      },
      {
        id: "emergency-contacts",
        label: "Contactos Emergencia",
        icon: Phone,
        roles: ["user", "admin", "monitor"],
      },
      {
        id: "personal-info",
        label: "Informacion Personal",
        icon: User,
        roles: ["user", "admin", "monitor"],
      },
      {
        id: "insurance",
        label: "Seguros",
        icon: Shield,
        roles: ["user", "admin", "monitor"]
      },
    ];
    const admin = [
      { id: "all-users", label: "All Users", icon: Users, roles: ["admin"] },
      {
        id: "all-vehicles",
        label: "All Vehicles",
        icon: Car,
        roles: ["admin"],
      },
      {
        id: "all-emergency-contacts",
        label: "All Emergency Contacts",
        icon: Phone,
        roles: ["admin"],
      },
      {
        id: "all-personal-info",
        label: "All Personal Info",
        icon: FileText,
        roles: ["admin"],
      },
    ];
    return [...base, ...admin].filter((item) => item.roles.includes(user.role));
  };

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white p-2 rounded-md shadow-sm"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-sm transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0`}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <Car className="h-6 w-6 mr-2 text-gray-800" />
          <span className="text-lg font-light">Dioses Guerreros MC</span>
        </div>
        <nav className="mt-6">
          {getMenuItems().map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors ${currentPage === item.id ? "bg-gray-50 text-gray-900 border-r-2 border-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <item.icon className="h-4 w-4 mr-3" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-normal text-gray-900">
                {user.username}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="h-3 w-3 mr-2" />
            <span className="text-xs">Cerrar Sesion</span>
          </button>
        </div>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation;
