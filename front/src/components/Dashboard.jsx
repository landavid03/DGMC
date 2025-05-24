
import React from "react";
import { useAuth } from "../context/AuthContext";
import { Car, Phone, Shield } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-light text-gray-900 mb-6">Dashboard</h1>
      <div className="bg-white rounded shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-normal mb-4">Welcome, {user.username}!</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Role: <span className="capitalize font-normal">{user.role}</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card icon={Car} title="Vehicles" desc="Manage your vehicles" />
          <Card icon={Phone} title="Emergency Contacts" desc="Keep contacts updated" />
          <Card icon={Shield} title="Insurance" desc="Manage policies" />
        </div>
      </div>
    </div>
  );
};

const Card = ({ icon: Icon, title, desc }) => (
  <div className="p-4 border border-gray-200">
    <Icon className="h-6 w-6 text-gray-800 mb-2" />
    <h3 className="font-normal text-sm">{title}</h3>
    <p className="text-xs text-gray-600">{desc}</p>
  </div>
);

export default Dashboard;
