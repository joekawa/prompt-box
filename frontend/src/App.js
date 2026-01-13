import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import WelcomePage from './components/pages/WelcomePage';
import LoginPage from './components/pages/LoginPage';
import SalesPage from './components/pages/SalesPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sales" element={<SalesPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
