import React from 'react';
import { useNavigate } from 'react-router-dom';

const SalesPage = () => {
  const navigate = useNavigate();
  return (
    <div className="page-container">
      <h1>Contact Sales</h1>
      <p>Ready to empower your organization? Let's talk.</p>
      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
};

export default SalesPage;
