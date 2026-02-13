import React, { useState } from 'react';
import { FaBars } from 'react-icons/fa';
import Sidebar from '../components/Sidebar/Sidebar';
import './DashboardLayout.css';

// role prop'unu (varsayılan 'admin') buraya ekledik
const DashboardLayout = ({ children, role = 'admin' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-container">
      <div className="mobile-nav">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        {/* Mobildeki başlık da role göre değişsin */}
        <span className="mobile-brand">
            {role === 'teacher' ? 'Öğretmen Portalı' : 'Admin Portalı'}
        </span>
      </div>

      {/* role bilgisini Sidebar'a iletiyoruz */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} role={role} />
      
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;