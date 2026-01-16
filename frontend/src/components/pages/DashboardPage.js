import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../shared/Sidebar';

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In a real app, we would call the logout API here
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        <h1>Dashboard</h1>
        <p>Welcome to Prompt Box!</p>
        <button className="btn-primary" onClick={handleLogout}>Logout</button>
      </main>
    </div>
  );
};

export default DashboardPage;

