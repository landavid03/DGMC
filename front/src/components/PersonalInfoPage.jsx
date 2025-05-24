import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
const API_URL = process.env.REACT_APP_API_URL;

const PersonalInfoPage = () => {
  const { user, token } = useAuth(); // Obtener token del contexto
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setForm((prevForm) => ({
            ...prevForm,
            latitude,
            longitude,
          }));
        },
        (error) => {
          console.warn("Geolocalización denegada o fallida:", error.message);
        },
      );
    }
  }, []);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/personal-info/user/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Token del contexto
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
  }, [user?.id, token]); // Dependencias correctas

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = info ? "PUT" : "POST";
      const url = info
        ? `${API_URL}/api/personal-info/${info.id}`
        : `${API_URL}/api/personal-info/`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Token del contexto
        },
        body: JSON.stringify({
          ...form,
          user_id: user.id,
        }),
      });

      if (!res.ok) throw new Error("Error en la solicitud");

      const updated = await res.json();
      setInfo(updated);
      alert("Información guardada correctamente");
    } catch (error) {
      console.error("Error saving personal info:", error);
      alert("Error al guardar la información.");
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-light mb-4">Información Personal</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Nombre(s)</label>
          <input
            type="text"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Apellido(s)</label>
          <input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Edad</label>
          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            min="18"
            max="120"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Tipo de sangre</label>
          <select
            name="blood_type"
            value={form.blood_type}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Seleccione</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Teléfono</label>
          <input
            type="text"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Dirección</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Ciudad</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Estado</label>
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Código Postal</label>
            <input
              type="text"
              name="postal_code"
              value={form.postal_code}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">País</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Alergias</label>
          <textarea
            name="allergies"
            value={form.allergies}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Notas médicas</label>
          <textarea
            name="medical_notes"
            value={form.medical_notes}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Latitud</label>
            <input
              type="text"
              name="latitude"
              value={form.latitude ?? ""}
              readOnly
              className="w-full border px-3 py-2 rounded bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Longitud</label>
            <input
              type="text"
              name="longitude"
              value={form.longitude ?? ""}
              readOnly
              className="w-full border px-3 py-2 rounded bg-gray-100"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {info ? "Actualizar" : "Crear"} información
        </button>
      </form>
    </div>
  );
};

export default PersonalInfoPage;
