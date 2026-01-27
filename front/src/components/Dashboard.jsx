
import React from "react";
import { useAuth } from "../context/AuthContext";
import { Car, Phone, Shield,Motorbike } from "lucide-react";

const Dashboard = ({
  setCurrentPage
}) => {
  const { user } = useAuth();
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-light text-gray-900 mb-6">    .</h1>
      <div className="bg-white rounded shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-normal mb-4">Bienvenido, {user.username}!</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Tipo: <span className="capitalize font-normal">{user.role}</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card icon={Motorbike} title="Motos" desc="Administra tus motos" pageId="vehicles" setCurrentPage={setCurrentPage}/>
          <Card icon={Phone} title="Contactos emergencia" desc="Actualiza tus contactos" pageId="emergency-contacts" setCurrentPage={setCurrentPage} />
          <Card icon={Shield} title="Seguro" desc="Administra tus polizas" pageId="insurance" setCurrentPage={setCurrentPage} />
        </div>
      </div>
    </div>
  );
};

const Card = ({ icon: Icon, title, desc, pageId, setCurrentPage }) => (
  <div 
  onClick={() => setCurrentPage(pageId)}
  className="p-4 border border-gray-200"
  >
    <Icon className="h-6 w-6 text-gray-800 mb-2" />
    <h3 className="font-normal text-sm">{title}</h3>
    <p className="text-xs text-gray-600">{desc}</p>
  </div>
);

export default Dashboard;
