import React, { useEffect, useState, useRef } from "react";
import { MapPin, Locate, AlertCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";
const API_URL = process.env.REACT_APP_API_URL;

const PersonalInfoPage = () => {
  const { user, token } = useAuth();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const isCleaningRef = useRef(false); // Para evitar limpiezas múltiples

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    age: "",
    blood_type: "",
    phone_number: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    allergies: "",
    medical_notes: "",
    latitude: null,
    longitude: null,
  });

  // Actualizar coordenadas
  const updateCoordinates = (lat, lng) => {
    setForm((prev) => ({
      ...prev,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
    }));
  };

  // Centrar mapa en coordenadas
  const centerMapOnCoordinates = (lat, lng) => {
    if (mapInstanceRef.current && markerRef.current && !isCleaningRef.current) {
      const position = { lat, lng };
      mapInstanceRef.current.setCenter(position);
      markerRef.current.setPosition(position);
      mapInstanceRef.current.setZoom(15);
    }
  };

  // Obtener ubicación actual
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateCoordinates(latitude, longitude);
      },
      (error) => {
        console.warn("Geolocalización denegada o fallida:", error.message);
        let message = "No se pudo obtener la ubicación actual. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += "Permiso denegado.";
            break;
          case error.POSITION_UNAVAILABLE:
            message += "Ubicación no disponible.";
            break;
          case error.TIMEOUT:
            message += "Tiempo de espera agotado.";
            break;
        }
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  useEffect(() => {
    const mockFetch = async () => {
      setLoading(false);
    };
    setTimeout(mockFetch, 1000);
  }, []);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/personal-info/user/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        console.log(res);

        if (res.ok) {
          const data = await res.json();
          console.log("Respuesta del backend:", data);
          setInfo(data.personal_info);
          setForm({
            first_name: data.personal_info.first_name || "",
            last_name: data.personal_info.last_name || "",
            age: data.personal_info.age || "",
            blood_type: data.personal_info.blood_type || "",
            phone_number: data.personal_info.phone_number || "",
            address: data.personal_info.address || "",
            city: data.personal_info.city || "",
            state: data.personal_info.state || "",
            postal_code: data.personal_info.postal_code || "",
            country: data.personal_info.country || "",
            allergies: data.personal_info.allergies || "",
            medical_notes: data.personal_info.medical_notes || "",
            latitude: data.personal_info.latitude || null,
            longitude: data.personal_info.longitude || null,
          });
        } else {
          setInfo(null);
        }
      } catch (error) {
        console.error("Error fetching info:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token && user?.id) {
      fetchInfo();
    } else {
      setLoading(false);
    }
  }, [user?.id, token]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === "" ? null : parseFloat(value);

    if (isNaN(numValue) && value !== "") return;

    setForm((prev) => ({ ...prev, [name]: numValue }));
  };

  const handleSubmit = () => {
    console.log("Guardando información:", form);
    alert("Información guardada correctamente (demo)");
  };

  const handleShowMap = () => {
    setShowMap(!showMap);
  };

  if (loading)
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando...</span>
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="pl-14 md:pl-0 text-2xl font-light mb-6">Información Personal</h1>

      <div className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre(s)</label>
            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ingresa tu nombre"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Apellido(s)
            </label>
            <input
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ingresa tus apellidos"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Edad</label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="18"
              max="120"
              placeholder="Edad"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Tipo de sangre
            </label>
            <select
              name="blood_type"
              value={form.blood_type}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccione</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                (type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Teléfono</label>
          <input
            type="tel"
            name="phone_number"
            value={form.phone_number}
            onChange={handleInputChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Número de teléfono"
          />
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium mb-2">Dirección</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleInputChange}
              className="flex-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dirección completa"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ciudad</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ciudad"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Estado</label>
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Estado"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Código Postal
            </label>
            <input
              type="text"
              name="postal_code"
              value={form.postal_code}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="CP"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">País</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleInputChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="País"
            />
          </div>
        </div>

        {/* Sección de ubicación */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Ubicación
          </h3>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={getCurrentLocation}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Locate className="w-4 h-4 mr-2" />
              Usar ubicación actual
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Latitud</label>
              <input
                type="number"
                name="latitude"
                value={form.latitude ?? ""}
                onChange={handleCoordinateChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Latitud"
                step="any"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Longitud</label>
              <input
                type="number"
                name="longitude"
                value={form.longitude ?? ""}
                onChange={handleCoordinateChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Longitud"
                step="any"
              />
            </div>
          </div>
        </div>

        {/* Información médica */}
        <div>
          <label className="block text-sm font-medium mb-2">Alergias</label>
          <textarea
            name="allergies"
            value={form.allergies}
            onChange={handleInputChange}
            rows="3"
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe tus alergias conocidas"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Notas médicas
          </label>
          <textarea
            name="medical_notes"
            value={form.medical_notes}
            onChange={handleInputChange}
            rows="3"
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Información médica adicional relevante"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {info ? "Actualizar" : "Crear"} información
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoPage;
