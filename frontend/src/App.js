import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import WelcomePage from './components/pages/WelcomePage';
import LoginPage from './components/pages/LoginPage';
import SalesPage from './components/pages/SalesPage';
import DashboardPage from './components/pages/DashboardPage';
import CreatePromptPage from './components/pages/CreatePromptPage';
import MyFolderPage from './components/pages/MyFolderPage';
import PublicFolderPage from './components/pages/PublicFolderPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/create-prompt" element={<CreatePromptPage />} />
          <Route path="/my-folder" element={<MyFolderPage />} />
          <Route path="/dashboard/public" element={<PublicFolderPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
