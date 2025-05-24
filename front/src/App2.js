import React, { useState, useEffect, createContext, useContext } from "react";

import {
  User,
  Car,
  Shield,
  Phone,
  FileText,
  Users,
  MapPin,
  LogOut,
  Menu,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

// Context para la autenticación
const AuthContext = createContext();
const API_URL = process.env.REACT_APP_API_URL;

// Hook para usar el contexto de autenticación
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Proveedor de autenticación
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem("token");
        setToken(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.message || "Login failed" };
      }
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Componente de Login
const LoginScreen = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    password_hash: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(credentials);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-white shadow-sm">
            <Car className="h-8 w-8 text-gray-800" />
          </div>
          <h2 className="mt-6 text-3xl font-light text-gray-900">
            Vehicle Management
          </h2>
          <p className="mt-2 text-gray-500">Sign in to your account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-4 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                placeholder="Enter your password"
                value={credentials.password_hash}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    password_hash: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 border border-gray-300 text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente de Navegación
const Navigation = ({
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    const baseItems = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: Car,
        roles: ["admin", "monitor", "user"],
      },
      { id: "vehicles", label: "My Vehicles", icon: Car, roles: ["user"] },
      {
        id: "emergency-contacts",
        label: "Emergency Contacts",
        icon: Phone,
        roles: ["user"],
      },
      {
        id: "personal-info",
        label: "Personal Info",
        icon: User,
        roles: ["user"],
      },
      { id: "insurance", label: "Insurance", icon: Shield, roles: ["user"] },
    ];

    const adminItems = [
      { id: "all-users", label: "All Users", icon: Users, roles: ["admin"] },
      {
        id: "all-vehicles",
        label: "All Vehicles",
        icon: Car,
        roles: ["admin", "monitor"],
      },
      {
        id: "all-personal-info",
        label: "All Personal Info",
        icon: FileText,
        roles: ["monitor"],
      },
    ];

    return [...baseItems, ...adminItems].filter((item) =>
      item.roles.includes(user.role),
    );
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile menu button */}
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

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-sm transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0`}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <Car className="h-6 w-6 mr-2 text-gray-800" />
          <span className="text-lg font-light">Vehicle Mgmt</span>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                currentPage === item.id
                  ? "bg-gray-50 text-gray-900 border-r-2 border-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
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
            className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-3 w-3 mr-2" />
            <span className="text-xs">Sign out</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

// Componente Dashboard
const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-light text-gray-900 mb-6">Dashboard</h1>
      <div className="bg-white rounded-none shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-normal mb-4">Welcome, {user.username}!</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Role: <span className="capitalize font-normal">{user.role}</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200">
            <Car className="h-6 w-6 text-gray-800 mb-2" />
            <h3 className="font-normal text-sm">Vehicles</h3>
            <p className="text-xs text-gray-600">Manage your vehicles</p>
          </div>
          <div className="p-4 border border-gray-200">
            <Phone className="h-6 w-6 text-gray-800 mb-2" />
            <h3 className="font-normal text-sm">Emergency Contacts</h3>
            <p className="text-xs text-gray-600">Keep contacts updated</p>
          </div>
          <div className="p-4 border border-gray-200">
            <Shield className="h-6 w-6 text-gray-800 mb-2" />
            <h3 className="font-normal text-sm">Insurance</h3>
            <p className="text-xs text-gray-600">Manage policies</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Vehículos
const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const { token, user } = useAuth();

  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    color: "",
    license_plate: "",
    vin: "",
    description: "",
    notes: "",
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/vehicles/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const vehicleData = {
      ...formData,
      user_id: user.id,
      year: parseInt(formData.year),
    };

    try {
      const url = editingVehicle
        ? `${API_URL}/api/vehicles/${editingVehicle.id}`
        : `${API_URL}/api/vehicles/`;

      const method = editingVehicle ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicleData),
      });

      if (response.ok) {
        fetchVehicles();
        setShowForm(false);
        setEditingVehicle(null);
        setFormData({
          make: "",
          model: "",
          year: "",
          color: "",
          license_plate: "",
          vin: "",
          description: "",
          notes: "",
        });
      }
    } catch (error) {
      console.error("Error saving vehicle:", error);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData(vehicle);
    setShowForm(true);
  };

  const handleDelete = async (vehicleId) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        const response = await fetch(`${API_URL}/api/vehicles/${vehicleId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchVehicles();
        }
      } catch (error) {
        console.error("Error deleting vehicle:", error);
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-sm">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-light text-gray-900">My Vehicles</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 border border-gray-300 hover:bg-gray-50 flex items-center text-sm"
        >
          <Plus className="h-3 w-3 mr-2" />
          Add Vehicle
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-md mx-4 border border-gray-200">
            <h2 className="text-lg font-normal mb-4">
              {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-gray-700 mb-1">
                  Make
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                  value={formData.make}
                  onChange={(e) =>
                    setFormData({ ...formData, make: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-700 mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                  value={formData.license_plate}
                  onChange={(e) =>
                    setFormData({ ...formData, license_plate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-700 mb-1">
                  VIN (Optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                  value={formData.vin}
                  onChange={(e) =>
                    setFormData({ ...formData, vin: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingVehicle(null);
                    setFormData({
                      make: "",
                      model: "",
                      year: "",
                      color: "",
                      license_plate: "",
                      vin: "",
                      description: "",
                      notes: "",
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-sm"
                >
                  {editingVehicle ? "Update" : "Add"} Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Car className="h-5 w-5 text-gray-800 mr-3" />
                <div>
                  <h3 className="font-normal text-sm">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-xs text-gray-600">{vehicle.year}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                >
                  <Edit className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <p>
                <span className="font-normal">Color:</span> {vehicle.color}
              </p>
              <p>
                <span className="font-normal">License:</span>{" "}
                {vehicle.license_plate}
              </p>
              {vehicle.vin && (
                <p>
                  <span className="font-normal">VIN:</span> {vehicle.vin}
                </p>
              )}
              {vehicle.description && (
                <p>
                  <span className="font-normal">Description:</span>{" "}
                  {vehicle.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-12 border border-gray-200">
          <Car className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-normal text-gray-900 mb-2">
            No vehicles yet
          </h3>
          <p className="text-gray-600 mb-4 text-xs">
            Start by adding your first vehicle
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-sm"
          >
            Add Vehicle
          </button>
        </div>
      )}
    </div>
  );
};

// Componente Principal
const App = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, token } = useAuth(); // Asegúrate de extraer token aquí

  const [contacts, setContacts] = useState([
    // Ejemplo de datos iniciales (opcional)
    //    {
    //      id: 1,
    //      name: "María González",
    //      relationship: "Esposa",
    //      phone: "+1 234 567 890",
    //      email: "maria@example.com",
    //   notes: "Contactar en caso de emergencia",
    //    },
  ]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [error, setError] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    relationship: "",
    phone: "",
    email: "",
    notes: "",
  });

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const response = await fetch(
        `${API_URL}/api/emergency-contacts/user/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }

      console.log("Raw response:", response); // ← Añade esto
      const data = await response.json();
      console.log("Parsed data:", data); // ← Y esto

      setContacts(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching contacts:", err);
    } finally {
      setLoadingContacts(false);
    }
  };
  useEffect(() => {
    if (user && token) {
      fetchContacts();
    }
  }, [user, token]);
  const handleSubmitContact = async (e) => {
    e.preventDefault();
    try {
      setLoadingContacts(true);
      const url = editingContact
        ? `${API_URL}/api/emergency-contacts/${editingContact.id}`
        : `${API_URL}/api/emergency-contacts`;

      const method = editingContact ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contactForm),
      });

      if (!response.ok) {
        throw new Error(
          editingContact
            ? "Failed to update contact"
            : "Failed to create contact",
        );
      }

      await fetchContacts(); // Recargar la lista después de la operación
      setShowAddContact(false);
      setContactForm({
        name: "",
        relationship: "",
        phone: "",
        email: "",
        notes: "",
      });
    } catch (err) {
      setError(err.message);
      console.error("Error saving contact:", err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleDeleteContact = async (id) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        setLoadingContacts(true);
        const response = await fetch(
          `${API_URL}/api/emergency-contacts/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to delete contact");
        }

        await fetchContacts(); // Recargar la lista después de eliminar
      } catch (err) {
        setError(err.message);
        console.error("Error deleting contact:", err);
      } finally {
        setLoadingContacts(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Car className="h-8 w-8 text-gray-800 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "vehicles":
        return <VehiclesPage />;
      case "emergency-contacts":
        return (
          <div className="p-6 max-w-4xl mx-auto">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-light text-gray-800">
                Emergency Contacts
              </h1>
              <button
                className="flex items-center text-sm border border-gray-300 px-4 py-2 hover:bg-gray-50"
                onClick={() => setShowAddContact(true)}
                disabled={loadingContacts}
              >
                {loadingContacts ? (
                  <span>Loading...</span>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </>
                )}
              </button>
            </div>

            {loadingContacts ? (
              <div className="flex justify-center py-12">
                <span>Loading contacts...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <div
                      key={contact._id}
                      className="bg-white border border-gray-200 p-5 hover:bg-gray-50 transition-colors"
                    >
                      {/* ... resto del JSX para cada contacto ... */}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border border-gray-200">
                    <Phone className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-normal text-gray-900">
                      No emergency contacts
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      Add your first emergency contact
                    </p>
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Add Contact
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Modal para añadir/editar contacto */}
            {showAddContact && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white p-6 w-full max-w-md mx-4 border border-gray-200">
                  <h2 className="text-lg font-medium mb-4">
                    {editingContact ? "Edit Contact" : "Add New Contact"}
                  </h2>
                  {loadingContacts && (
                    <p className="text-sm text-gray-600 mb-4">
                      Saving contact...
                    </p>
                  )}
                  <form onSubmit={handleSubmitContact}>
                    {/* ... campos del formulario ... */}
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      case "personal-info":
        return (
          <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-light text-gray-800">
                Personal Information
              </h1>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                      placeholder="John"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                      placeholder="Doe"
                    />
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-normal text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-normal text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                      placeholder="Street address"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                      placeholder="City"
                    />
                  </div>

                  {/* ZIP Code */}
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-1">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
                      placeholder="00000"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    type="button"
                    className="px-5 py-2 text-sm text-gray-600 hover:text-gray-800 mr-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      case "insurance":
        return (
          <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-xl font-light">Insurance Policies</h1>
            <p className="mt-4 text-gray-600 text-sm">
              Insurance policy management coming soon...
            </p>
          </div>
        );
      case "all-users":
        return (
          <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-xl font-light">All Users</h1>
            <p className="mt-4 text-gray-600 text-sm">
              User management coming soon...
            </p>
          </div>
        );
      case "all-vehicles":
        return (
          <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-xl font-light">All Vehicles</h1>
            <p className="mt-4 text-gray-600 text-sm">
              All vehicles management coming soon...
            </p>
          </div>
        );
      case "all-personal-info":
        return (
          <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-xl font-light">All Personal Information</h1>
            <p className="mt-4 text-gray-600 text-sm">
              All personal information coming soon...
            </p>
          </div>
        );
      default:
        return <Dashboard />;
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

// Componente raíz con el proveedor de autenticación
const VehicleManagementApp = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default VehicleManagementApp;
