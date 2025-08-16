import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const initialFormState = {
  name: "",
  description: "",
  make: "",
  color: "",
  license_plate: "",
  model: "",
  year: "",
  vin: "",
  notes: "",
  user_id: "",
  image: null,
};

const API_URL = process.env.REACT_APP_API_URL;

const AdminVehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useAuth();

  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  
  // Filtros para el administrador
  const [filters, setFilters] = useState({
    userId: "",
    make: "",
    year: "",
    searchTerm: ""
  });

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      // Endpoint para obtener TODOS los vehículos (solo admin)
      const res = await fetch(`${API_URL}/api/vehicles/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Error fetching vehicles");
      const data = await res.json();
      setVehicles(data.vehicles);
    } catch (err) {
      setError("Error fetching vehicles.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Error fetching users");
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((prev) => ({ ...prev, image: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingId
      ? `${API_URL}/api/admin/vehicles/${editingId}`
      : `${API_URL}/api/admin/vehicles/`;

    const method = editingId ? "PUT" : "POST";

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        formData.append(key, value);
      }
    });

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Error saving vehicle");

      setForm(initialFormState);
      setEditingId(null);
      fetchVehicles();
    } catch (err) {
      alert("Failed to save vehicle.");
    }
  };

  const handleEdit = (vehicle) => {
    setForm({
      name: vehicle.name || "",
      description: vehicle.description || "",
      make: vehicle.make || "",
      color: vehicle.color || "",
      license_plate: vehicle.license_plate || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      vin: vehicle.vin || "",
      notes: vehicle.notes || "",
      user_id: vehicle.user_id || "",
    });
    setEditingId(vehicle.id);
  };

  const handleCancelEdit = () => {
    setForm(initialFormState);
    setEditingId(null);
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm("Delete this vehicle?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/vehicles/${vehicleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Error deleting");
      fetchVehicles();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  // Función para filtrar vehículos
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesUserId = !filters.userId || vehicle.user_id.toString() === filters.userId;
    const matchesMake = !filters.make || vehicle.make.toLowerCase().includes(filters.make.toLowerCase());
    const matchesYear = !filters.year || vehicle.year.toString().includes(filters.year);
    const matchesSearchTerm = !filters.searchTerm || 
      vehicle.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      vehicle.license_plate.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    return matchesUserId && matchesMake && matchesYear && matchesSearchTerm;
  });

  // Función para obtener el nombre del usuario
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.username} (${user.email})` : `Usuario ${userId}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-light mb-6">Administración de Vehículos</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Filtros */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-medium mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <select
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Todos los usuarios</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca
            </label>
            <input
              type="text"
              name="make"
              value={filters.make}
              onChange={handleFilterChange}
              placeholder="Filtrar por marca"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año
            </label>
            <input
              type="text"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              placeholder="Filtrar por año"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Búsqueda general
            </label>
            <input
              type="text"
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleFilterChange}
              placeholder="Nombre, placa, VIN..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800">Total Vehículos</h3>
          <p className="text-2xl font-bold text-blue-600">{vehicles.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-green-800">Vehículos Filtrados</h3>
          <p className="text-2xl font-bold text-green-600">{filteredVehicles.length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-purple-800">Usuarios con Vehículos</h3>
          <p className="text-2xl font-bold text-purple-600">
            {new Set(vehicles.map(v => v.user_id)).size}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="border p-6 rounded-lg shadow-sm bg-white"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {/* Información del propietario */}
                <div className="bg-gray-100 p-3 rounded-lg mb-4">
                  <h3 className="font-semibold text-gray-800">Propietario</h3>
                  <p className="text-sm text-gray-600">{getUserName(vehicle.user_id)}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h2 className="font-semibold text-xl mb-2 text-blue-600">{vehicle.name}</h2>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li><strong>Marca:</strong> {vehicle.make}</li>
                      <li><strong>Modelo:</strong> {vehicle.model}</li>
                      <li><strong>Año:</strong> {vehicle.year}</li>
                      <li><strong>Color:</strong> {vehicle.color}</li>
                      <li><strong>Placa:</strong> {vehicle.license_plate}</li>
                      <li><strong>VIN:</strong> {vehicle.vin}</li>
                    </ul>
                  </div>
                  <div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li><strong>Descripción:</strong> {vehicle.description}</li>
                      <li><strong>Notas:</strong> {vehicle.notes}</li>
                      <li><strong>Creado:</strong> {new Date(vehicle.created_at).toLocaleDateString()}</li>
                      <li><strong>Actualizado:</strong> {new Date(vehicle.updated_at).toLocaleDateString()}</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {vehicle.image_url && (
                <div className="w-48 h-32 overflow-hidden rounded-lg shadow ml-6">
                  <img
                    src={vehicle.image_url}
                    alt={`Imagen de ${vehicle.name}`}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
              <button
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                onClick={() => handleEdit(vehicle)}
              >
                Editar
              </button>
              <button
                className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                onClick={() => handleDelete(vehicle.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {filteredVehicles.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron vehículos con los filtros aplicados.
          </div>
        )}

        {/* Formulario para agregar/editar vehículos */}
        {/* <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-6 space-y-6 mt-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingId ? "Editar Vehículo" : "Registrar Nuevo Vehículo"}
          </h2>
          <p className="text-sm text-gray-500">
            {editingId ? "Modifica los campos necesarios." : "Completa todos los campos para registrar un nuevo vehículo."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Usuario Propietario *
              </label>
              <select
                name="user_id"
                value={form.user_id}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Seleccionar usuario</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre del vehículo
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {[
              { name: "make", label: "Marca" },
              { name: "model", label: "Modelo" },
              { name: "year", label: "Año" },
              { name: "color", label: "Color" },
              { name: "license_plate", label: "Placa" },
              { name: "vin", label: "VIN" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                <input
                  type="text"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notas</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Imagen del vehículo
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleInputChange}
              className="mt-1 block w-full text-sm text-gray-700 border border-gray-300 rounded-md shadow-sm file:bg-blue-600 file:text-white file:border-none file:px-4 file:py-2 file:rounded file:mr-4 hover:file:bg-blue-700"
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              {editingId ? "Actualizar vehículo" : "Crear vehículo"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center px-6 py-3 bg-gray-400 text-white text-sm font-medium rounded-md hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form> */}
      </div>
    </div>
  );
};

export default AdminVehiclesPage;