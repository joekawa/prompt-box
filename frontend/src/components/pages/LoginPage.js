import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Connection refused. Please check if the backend is running.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="auth-form-container">
        <button className="btn-text" onClick={() => navigate('/')} style={{ marginBottom: '20px', padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Home
        </button>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Log in to your Prompt Box account</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader className="animate-spin" size={18} /> Logging in...
              </span>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <span className="link-text" onClick={() => navigate('/sales')}>
            Contact Sales
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
