import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const initialFormState = {
  name: "",
  description: "",
};
const API_URL = process.env.REACT_APP_API_URL;

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useAuth(); // Obtener token del contexto

  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);

  // Obtener todos los vehículos
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      console.log("Token:", token);
      const res = await fetch(`${API_URL}/api/vehicles/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Token del contexto
        },
      });
      if (!res.ok) throw new Error("Error fetching vehicles");
      const data = await res.json();
      setVehicles(data);
    } catch (err) {
      setError("Error fetching vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Crear o actualizar un vehículo
  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API_URL}/api/vehicles/${editingId}`
      : "/api/vehicles/";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Token del contexto
        },
        body: JSON.stringify(form),
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
    setForm({ name: vehicle.name, description: vehicle.description });
    setEditingId(vehicle.id);
  };

  const handleCancelEdit = () => {
    setForm(initialFormState);
    setEditingId(null);
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm("Delete this vehicle?")) return;
    try {
      const res = await fetch(`${API_URL}/api/vehicles/${vehicleId}`, {
        method: "DELETE",
        Authorization: `Bearer ${token}`, // Token del contexto
      });
      if (!res.ok) throw new Error("Error deleting");
      fetchVehicles();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-light mb-4">Vehicles</h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded mt-1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded mt-1"
          />
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {editingId ? "Update Vehicle" : "Create Vehicle"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-400 text-white rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Lista de vehículos */}
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-4">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="border p-4 rounded shadow-sm flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold text-lg">{vehicle.name}</h2>
              <p className="text-sm text-gray-600">{vehicle.description}</p>
            </div>
            <div className="space-x-2">
              <button
                className="px-3 py-1 text-white bg-blue-500 rounded"
                onClick={() => handleEdit(vehicle)}
              >
                Edit
              </button>
              <button
                className="px-3 py-1 text-white bg-red-500 rounded"
                onClick={() => handleDelete(vehicle.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehiclesPage;
