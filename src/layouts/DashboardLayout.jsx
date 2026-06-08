import React, { useState } from 'react';
import { FaBars } from 'react-icons/fa';
import Sidebar from '../components/Sidebar/Sidebar';
import './DashboardLayout.css';

const DashboardLayout = ({ children, role = 'admin' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Rol bilgisini alıp uygun başlığı dönen küçük bir yardımcı fonksiyon
  const getPortalTitle = (userRole) => {
    switch(userRole) {
      case 'student':
        return 'Öğrenci Portalı';
      case 'teacher':
        return 'Hoca Portalı';
      case 'admin':
      default:
        return 'Admin Portalı';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="mobile-nav">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        {/* Başlık artık dinamik ve 3 rolü de destekliyor */}
        <span className="mobile-brand">
            {getPortalTitle(role)}
        </span>
      </div>

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