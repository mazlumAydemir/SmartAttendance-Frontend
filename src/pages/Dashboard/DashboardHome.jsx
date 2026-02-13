import React, { useEffect, useState } from 'react';
import { FaSignOutAlt, FaUserShield, FaUniversity, FaBuilding, FaBook, FaChalkboardTeacher, FaUserFriends, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
  const navigate = useNavigate();
  
  // State Tanımları
  const [adminName, setAdminName] = useState("ADMIN KULLANICI");
  const [adminRole, setAdminRole] = useState("Sistem Yöneticisi");

  useEffect(() => {
    // Bilgileri Çek
    const storedName = localStorage.getItem('fullName');
    const storedRole = localStorage.getItem('userRole');

    if (storedName) setAdminName(storedName.toUpperCase());
    if (storedRole) setAdminRole(storedRole);
  }, []);

  const handleLogout = () => {
    localStorage.clear(); // Temiz çıkış
    navigate('/');
  };

  // İstatistik Verileri
  const stats = [
    { title: 'Toplam Fakülte', count: 4, icon: <FaUniversity />, color: '#ff9800' },
    { title: 'Toplam Bölüm', count: 19, icon: <FaBuilding />, color: '#9c27b0' },
    { title: 'Toplam Ders', count: 5, icon: <FaBook />, color: '#9c27b0' },
    { title: 'Toplam Öğretmen', count: 12, icon: <FaChalkboardTeacher />, color: '#039be5' },
    { title: 'Toplam Öğrenci', count: 5, icon: <FaUserFriends />, color: '#039be5' },
    { title: 'Aktif Öğrenci', count: 4, icon: <FaCheckCircle />, color: '#4caf50' },
    { title: 'Pasif Öğrenci', count: 1, icon: <FaTimesCircle />, color: '#f44336' },
  ];

  return (
    <DashboardLayout role="admin">
      {/* Üst Header */}
      <header className="dashboard-header">
        <h1>Ana Sayfa</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={handleLogout}/>
        </div>
      </header>

      {/* Kullanıcı Bilgi Kartı */}
      <div className="user-welcome-card">
        <div className="user-info-left">
          <div className="user-avatar-circle">
            <FaUserShield />
          </div>
          <div>
            {/* Dinamik İsim */}
            <h3>{adminName}</h3>
            <span className="user-role">{adminRole}</span>
          </div>
        </div>
        <span className="status-badge">AKTİF</span>
      </div>

      {/* İstatistik Başlığı */}
      <h2 className="section-title">Sistem İstatistikleri</h2>

      {/* İstatistik Grid Yapısı */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-header">
              <span className="stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </span>
              <span className="stat-count" style={{ color: stat.color }}>
                {stat.count}
              </span>
            </div>
            <div className="stat-title">{stat.title}</div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;