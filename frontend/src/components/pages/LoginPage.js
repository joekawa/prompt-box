import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  return (
    <div className="page-container">
      <h1>Login</h1>
      <p>Enter your credentials to access Prompt Box.</p>
      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
};

export default LoginPage;
