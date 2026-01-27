import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const initialFormState = {
  name: "",
  relationship: "",
  phone_number: "",
  alternative_phone: "",
  email: "",
  notes: "",
};

const API_URL = process.env.REACT_APP_API_URL;

const EmergencyContactsPage = () => {
  const { user, token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/emergency-contacts/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error fetching contacts");
      const data = await res.json();
            console.log("Respuesta del backend:", data);

      setContacts(data.contacts);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch emergency contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleInputChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API_URL}/api/emergency-contacts/${editingId}`
      : `${API_URL}/api/emergency-contacts/`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, user_id: user.id }),
      });
      if (!res.ok) throw new Error("Error saving contact");

      setForm(initialFormState);
      setEditingId(null);
      fetchContacts();
    } catch (err) {
      console.error(err);
      alert("Failed to save contact.");
    }
  };

  const handleEdit = (contact) => {
    setForm({
      name: contact.name,
      relationship: contact.relationship,
      phone_number: contact.phone_number,
      alternative_phone: contact.alternative_phone || "",
      email: contact.email || "",
      notes: contact.notes || "",
    });
    setEditingId(contact.id);
  };

  const handleCancelEdit = () => {
    setForm(initialFormState);
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this emergency contact?")) return;
    try {
      const res = await fetch(`${API_URL}/api/emergency-contacts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error deleting contact");
      fetchContacts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete contact.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="pl-14 md:pl-0 text-xl font-light">Contactos de Emergencia</h1>



      {/* Lista de contactos */}
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-4">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="border p-4 rounded shadow-sm flex justify-between items-start"
          >
            <div>
              <h2 className="font-semibold">{contact.name}</h2>
              <p className="text-sm text-gray-700">
                <strong>Relacion:</strong> {contact.relationship}<br />
                <strong>Telefono:</strong> {contact.phone_number}<br />
                {contact.alternative_phone && (
                  <>
                    <strong>Otro telefono:</strong> {contact.alternative_phone}<br />
                  </>
                )}
                {contact.email && (
                  <>
                    <strong>Email:</strong> {contact.email}<br />
                  </>
                )}
                {contact.notes && (
                  <>
                    <strong>Notas:</strong> {contact.notes}<br />
                  </>
                )}
              </p>
            </div>
            <div className="space-x-2 mt-2">
              <button
                className="px-3 py-1 text-white bg-blue-500 rounded"
                onClick={() => handleEdit(contact)}
              >
                Editar
              </button>
              <button
                className="px-3 py-1 text-white bg-red-500 rounded"
                onClick={() => handleDelete(contact.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

         {/* Formulario */}
         <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-6 space-y-6 mt-8 border border-gray-200">
  <h2 className="text-xl font-semibold text-gray-800">
    {editingId ? "Editar Contacto de Emergencia" : "Nuevo Contacto de Emergencia"}
  </h2>
  <p className="text-sm text-gray-500">
    Proporciona la información de la persona a contactar en caso de emergencia.
  </p>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700">Nombre</label>
      <input
        type="text"
        name="name"
        value={form.name}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Relación</label>
      <input
        type="text"
        name="relationship"
        value={form.relationship}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Teléfono principal</label>
      <input
        type="text"
        name="phone_number"
        value={form.phone_number}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Teléfono alternativo</label>
      <input
        type="text"
        name="alternative_phone"
        value={form.alternative_phone}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>

    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>

    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700">Notas</label>
      <textarea
        name="notes"
        value={form.notes}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  </div>

  <div className="flex gap-4 mt-4">
    <button
      type="submit"
      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
    >
      {editingId ? "Actualizar Contacto" : "Crear Contacto"}
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

export default EmergencyContactsPage;
