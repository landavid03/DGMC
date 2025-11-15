import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

// 1. Estado inicial adaptado a UserSchema
const initialFormState = {
  username: "",
  email: "",
  password: "", // El estado del form usa 'password'
  role: "user",   // Reemplaza a 'is_admin'
};

const API_URL = process.env.REACT_APP_API_URL;

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
         const errorData = await res.json();
         throw new Error(errorData.message || "Error fetching users");
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  // 2. handleInputChange (simplificado, ya no necesita 'checked')
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // 3. handleSubmit (adaptado para 'password_hash' y 'role')
  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingId
      ? `${API_URL}/api/users/${editingId}` // PUT /api/users/<id>
      : `${API_URL}/api/users/`;           // POST /api/users/

    const method = editingId ? "PUT" : "POST";

    // --- Inicio: Lógica de Payload compatible con Schema ---
    
    // Preparamos el payload base
    const payload = {
      username: form.username,
      email: form.email,
      role: form.role,
    };

    // Al crear (POST), 'password_hash' es requerido (según UserSchema)
    if (!editingId) {
      payload.password_hash = form.password;
    } 
    // Al editar (PUT), 'password_hash' es opcional (según UserUpdateSchema)
    // Solo lo añadimos si el usuario escribió una nueva contraseña
    else if (editingId && form.password) {
      payload.password_hash = form.password;
    }
    // --- Fin: Lógica de Payload ---

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error saving user");
      }

      setForm(initialFormState);
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      alert(`Failed to save user: ${err.message}`);
    }
  };

  // 4. handleEdit (adaptado para 'role' y sin 'full_name')
  const handleEdit = (userToEdit) => {
    setForm({
      username: userToEdit.username || "",
      email: userToEdit.email || "",
      role: userToEdit.role || "user", // Usa 'role'
      password: "", // Siempre vacío al editar
    });
    setEditingId(userToEdit.id);
  };

  const handleCancelEdit = () => {
    setForm(initialFormState);
    setEditingId(null);
  };

  // 5. handleDelete (sin cambios, sigue siendo correcto)
  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user? This action is permanent.")) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error deleting user");
      }
      fetchUsers();
    } catch (err) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-light mb-4">User Management</h1>

      {loading && <p>Loading users...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {/* 6. Lista de usuarios (adaptada a los nuevos campos) */}
        {users.map((userItem) => (
          <div
            key={userItem.id}
            className="border p-4 rounded shadow-sm flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold text-lg mb-1">{userItem.username}</h2>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Email:</strong> {userItem.email}</li>
                <li><strong>Role:</strong> <span className="capitalize">{userItem.role}</span></li>
                <li><strong>Status:</strong> {userItem.is_active ? "Active" : "Inactive"}</li>
                <li><strong>ID:</strong> {userItem.id}</li>
              </ul>
            </div>
            <div className="space-x-2">
              <button
                className="px-3 py-1 text-white bg-blue-500 rounded"
                onClick={() => handleEdit(userItem)}
              >
                Edit
              </button>
              <button
                className="px-3 py-1 text-white bg-red-500 rounded"
                onClick={() => handleDelete(userItem.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* 7. Formulario (adaptado a los nuevos campos) */}
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-6 space-y-6 mt-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingId ? "Edit User" : "Create New User"}
          </h2>
          <p className="text-sm text-gray-500">Complete all fields to register a user.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleInputChange}
                placeholder={editingId ? "Leave blank to keep current" : ""}
                autoComplete="new-password"
                required={!editingId} // Requerido solo al crear
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            
            {/* Campo de 'Role' con <select> */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="user">User</option>
                <option value="monitor">Monitor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
            >
              {editingId ? "Update User" : "Create User"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-md hover:bg-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsersPage;