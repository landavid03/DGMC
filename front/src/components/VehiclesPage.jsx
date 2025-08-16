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
  image: null, // NUEVO

};

const API_URL = process.env.REACT_APP_API_URL;

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useAuth();

  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/vehicles/user/${user.id}`, {
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

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((prev) => ({ ...prev, image: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingId
      ? `${API_URL}/api/vehicles/${editingId}`
      : `${API_URL}/api/vehicles/`;

    const method = editingId ? "PUT" : "POST";

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) {
        formData.append(key, value);
      }
    });

    formData.set("user_id", user.id); // Asegurar el user_id

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
      user_id: vehicle.user_id || user.id,
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
      const res = await fetch(`${API_URL}/api/vehicles/${vehicleId}`, {
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-light mb-4">Vehicles</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="border p-4 rounded shadow-sm flex justify-between items-center"
          >
            <div>
              <strong>Marca:</strong> {vehicle.make}
              <h2 className="font-semibold text-lg mb-1">{vehicle.name}</h2>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Description:</strong> {vehicle.description}</li>
                <li><strong>Color:</strong> {vehicle.color}</li>
                <li><strong>License Plate:</strong> {vehicle.license_plate}</li>
                <li><strong>Model:</strong> {vehicle.model}</li>
                <li><strong>Year:</strong> {vehicle.year}</li>
                <li><strong>VIN:</strong> {vehicle.vin}</li>
                <li><strong>Notes:</strong> {vehicle.notes}</li>
                <li><strong>User ID:</strong> {vehicle.user_id}</li>
                <li><strong>Created At:</strong> {vehicle.created_at || "N/A"}</li>
                <li><strong>Updated At:</strong> {vehicle.updated_at || "N/A"}</li>
              </ul>
            </div>
            {vehicle.image_url && (
              <div className="w-48 h-32 overflow-hidden rounded shadow">
                <img
                  src={vehicle.image_url}
                  alt={`Imagen de ${vehicle.name}`}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-6 space-y-6 mt-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingId ? "Editar Vehículo" : "Registrar Nuevo Vehículo"}
          </h2>
          <p className="text-sm text-gray-500">Completa todos los campos para registrar tu vehículo.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campos de texto */}
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

          {/* Campos textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notas</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Campo para imagen */}
          {/* <div>
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
          </div> */}

          {/* Botones */}
          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
            >
              {editingId ? "Actualizar vehículo" : "Crear vehículo"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-md hover:bg-gray-500"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};

export default VehiclesPage;
