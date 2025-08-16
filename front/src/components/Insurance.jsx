import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const initialFormState = {
  company: "",
  policy_number: "",
  coverage_type: "",
  start_date: "",
  end_date: "",
  notes: "",
  vehicle_id: "",
  policy_file: null, // Para el archivo
};

const API_URL = process.env.REACT_APP_API_URL;

const InsurancePage = () => {
  const { user, token } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/insurance-policies/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error fetching policies");
      const data = await res.json();
      console.log("🚀 Response data:", data);
      setPolicies(data.policies || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch insurance policies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/vehicles/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error fetching vehicles");
      const data = await res.json();
      setVehicles(data.vehicles || []);
      console.log("data.vehicles");
      console.log(data.vehicles);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch vehicles.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "policy_file") {
      const file = files[0];
      if (file) {
        // Validar tipo de archivo
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
          alert('Solo se permiten archivos PDF, JPG, JPEG o PNG');
          e.target.value = '';
          return;
        }
        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert('El archivo no puede ser mayor a 10MB');
          e.target.value = '';
          return;
        }
        setForm(prev => ({ ...prev, policy_file: file }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API_URL}/api/insurance-policies/${editingId}`
      : `${API_URL}/api/insurance-policies/`;

    try {
      // Crear FormData para enviar archivos
      const formData = new FormData();
      
      // Agregar todos los campos del formulario
      Object.keys(form).forEach(key => {
        if (key === 'policy_file') {
          if (form[key]) {
            formData.append('policy_file', form[key]);
          }
        } else {
          formData.append(key, form[key]);
        }
      });
      
      // Agregar user_id
      formData.append('user_id', user.id);

      // Crear XMLHttpRequest para poder mostrar progreso de subida
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setForm(initialFormState);
            setEditingId(null);
            fetchPolicies();
            setUploadProgress(0);
            resolve();
          } else {
            reject(new Error('Error saving policy'));
          }
          setIsUploading(false);
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
          setIsUploading(false);
        });

        xhr.open(method, url);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

    } catch (err) {
      console.error(err);
      alert("Failed to save insurance policy.");
      setIsUploading(false);
    }
  };

  const handleEdit = (policy) => {
    setForm({
      company: policy.company,
      policy_number: policy.policy_number,
      coverage_type: policy.coverage_type || "",
      start_date: policy.start_date,
      end_date: policy.end_date,
      notes: policy.notes || "",
      vehicle_id: policy.vehicle_id,
      policy_file: null, // No pre-cargar archivo en edición
    });
    setEditingId(policy.id);
  };

  const handleCancelEdit = () => {
    setForm(initialFormState);
    setEditingId(null);
    setUploadProgress(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this Insurance Policy?")) return;
    try {
      const res = await fetch(`${API_URL}/api/policies/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error deleting policy");
      fetchPolicies();
    } catch (err) {
      console.error(err);
      alert("Failed to delete insurance policy.");
    }
  };

  const handleDownloadFile = (fileUrl, fileName) => {
    if (!fileUrl) {
      alert('No hay archivo disponible para descargar');
      return;
    }
    
    // Crear un enlace temporal para descargar
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'policy_document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getVehicleNameById = (id) => {
    const vehicle = vehicles.find((v) => v.id === id);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : `ID ${id}`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-light">Insurance Policies</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      <div className="space-y-4">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className="border p-4 rounded shadow-sm flex justify-between items-start"
          >
            <div className="flex-1">
              <h2 className="font-semibold">{policy.company}</h2>
              <p className="text-sm text-gray-700">
                <strong>Policy #:</strong> {policy.policy_number}<br />
                <strong>Coverage:</strong> {policy.coverage_type}<br />
                <strong>Vehículo:</strong> {getVehicleNameById(policy.vehicle_id)}<br />
                <strong>Start:</strong> {policy.start_date}<br />
                <strong>End:</strong> {policy.end_date}<br />
                {policy.notes && (
                  <>
                    <strong>Notes:</strong> {policy.notes}<br />
                  </>
                )}
                {policy.file_url && (
                  <div className="mt-2">
                    <strong>Documento:</strong>
                    <button
                      onClick={() => handleDownloadFile(policy.file_url, `${policy.company}_${policy.policy_number}.pdf`)}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      📄 Descargar archivo
                    </button>
                  </div>
                )}
              </p>
            </div>
            <div className="space-x-2 mt-2">
              <button
                className="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                onClick={() => handleEdit(policy)}
              >
                Edit
              </button>
              <button
                className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                onClick={() => handleDelete(policy.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-6 space-y-6 mt-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingId ? "Editar Póliza de Seguro" : "Nueva Póliza de Seguro"}
          </h2>
          <p className="text-sm text-gray-500">
            Completa la información relacionada con la póliza del vehículo.
          </p>

          {/* Barra de progreso de subida */}
          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <p className="text-sm text-gray-600 mt-1">Subiendo archivo... {uploadProgress}%</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Compañía *</label>
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleInputChange}
                required
                disabled={isUploading}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Número de póliza *</label>
              <input
                type="text"
                name="policy_number"
                value={form.policy_number}
                onChange={handleInputChange}
                required
                disabled={isUploading}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cobertura</label>
              <input
                type="text"
                name="coverage_type"
                value={form.coverage_type}
                onChange={handleInputChange}
                disabled={isUploading}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Vehículo *</label>
              <select
                name="vehicle_id"
                value={form.vehicle_id}
                onChange={handleInputChange}
                required
                disabled={isUploading}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="">Selecciona un vehículo</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.year})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Inicio *</label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleInputChange}
                required
                disabled={isUploading}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fin *</label>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleInputChange}
                required
                disabled={isUploading}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Notas</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                disabled={isUploading}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            {/* Campo para subir archivo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Documento de póliza {editingId ? '(opcional - mantener vacío para no cambiar)' : ''}
              </label>
              <input
                type="file"
                name="policy_file"
                onChange={handleInputChange}
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={isUploading}
                className="mt-1 block w-full text-sm text-gray-700 border border-gray-300 rounded-md shadow-sm file:bg-blue-600 file:text-white file:border-none file:px-4 file:py-2 file:rounded file:mr-4 hover:file:bg-blue-700 disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos permitidos: PDF, JPG, PNG. Tamaño máximo: 10MB
              </p>
              {form.policy_file && (
                <p className="text-sm text-green-600 mt-2">
                  📄 Archivo seleccionado: {form.policy_file.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Subiendo...
                </>
              ) : (
                editingId ? "Actualizar Póliza" : "Crear Póliza"
              )}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isUploading}
                className="inline-flex items-center px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-md hover:bg-gray-500 disabled:cursor-not-allowed"
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

export default InsurancePage;