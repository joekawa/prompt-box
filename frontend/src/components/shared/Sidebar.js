import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Folder,
  Globe,
  Users,
  UserCog,
  User,
  Menu,
  ChevronLeft,
  PlusCircle
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { icon: <Home size={20} />, label: 'Home', path: '/dashboard' },
    { icon: <PlusCircle size={20} />, label: 'Create Prompt', path: '/dashboard/create-prompt' },
    { icon: <Folder size={20} />, label: 'My Folder', path: '/dashboard/private' },
    { icon: <Globe size={20} />, label: 'Public Folder', path: '/dashboard/public' },
    { icon: <Users size={20} />, label: 'Manage Teams', path: '/dashboard/teams' },
    { icon: <UserCog size={20} />, label: 'Manage Users', path: '/dashboard/users' },
  ];

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
         <button className="sidebar-toggle-btn" onClick={() => setIsExpanded(!isExpanded)}>
           {isExpanded ? <ChevronLeft size={24} /> : <Menu size={24} />}
         </button>
      </div>

      <nav className="sidebar-nav">
         {menuItems.map((item, index) => (
           <button
             key={index}
             className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
             onClick={() => navigate(item.path)}
             title={!isExpanded ? item.label : ''}
           >
             <span className="nav-icon">{item.icon}</span>
             <span className="nav-label">{item.label}</span>
           </button>
         ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="nav-item"
          onClick={() => navigate('/dashboard/profile')}
          title={!isExpanded ? 'Profile' : ''}
        >
          <span className="nav-icon"><User size={20} /></span>
          <span className="nav-label">Profile</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
