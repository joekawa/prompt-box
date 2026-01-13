import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Layers, ArrowRight } from 'lucide-react';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <header className="welcome-header">
        <div className="logo">Prompt Box</div>
        <nav>
          <button className="btn-text" onClick={() => navigate('/login')}>Login</button>
          <button className="btn-primary" onClick={() => navigate('/sales')}>Get Started</button>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <h1>Enterprise-Grade AI Prompt Management</h1>
          <p className="hero-subtitle">
            Orchestrate your AI workflows with precision. Manage, share, and govern AI prompts across your entire organization.
          </p>
          <div className="hero-actions">
            <button className="btn-large btn-primary" onClick={() => navigate('/sales')}>
              Request Demo <ArrowRight size={18} />
            </button>
            <button className="btn-large btn-secondary" onClick={() => navigate('/login')}>
              Existing User
            </button>
          </div>
        </section>

        <section className="features-section">
          <div className="feature-card">
            <Shield className="feature-icon" size={32} />
            <h3>RBAC & Security</h3>
            <p>Granular role-based access control ensures the right people have access to the right prompts.</p>
          </div>
          <div className="feature-card">
            <Users className="feature-icon" size={32} />
            <h3>Team Hierarchy</h3>
            <p>Mirror your organization's structure. Share prompts within teams or across departments easily.</p>
          </div>
          <div className="feature-card">
            <Layers className="feature-icon" size={32} />
            <h3>Model Agnostic</h3>
            <p>Centralize prompts for any LLM. Switch models without losing your prompt engineering assets.</p>
          </div>
        </section>
      </main>

      <footer className="welcome-footer">
        <p>&copy; 2026 Prompt Box. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default WelcomePage;
