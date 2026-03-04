import React, { useEffect, useState } from 'react';
import { FaSignOutAlt, FaUserShield, FaUniversity, FaBuilding, FaBook, FaChalkboardTeacher, FaUserFriends, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 🚀 AXIOS EKLENDİ

const DashboardHome = () => {
  const navigate = useNavigate();
  
  // --- STATE TANIMLARI ---
  const [adminName, setAdminName] = useState("ADMIN KULLANICI");
  const [adminRole, setAdminRole] = useState("Sistem Yöneticisi");
  const [loading, setLoading] = useState(true);

  // Dinamik İstatistik State'i
  const [dynamicStats, setDynamicStats] = useState({
    faculties: 4,     // Şimdilik sabit (İleride DB'den çekilebilir)
    departments: 19,  // Şimdilik sabit
    courses: 5,       // Şimdilik sabit
    teachers: 0,      // 🚀 Canlı gelecek
    students: 0,      // 🚀 Canlı gelecek
    activeStudents: 0,// 🚀 Canlı gelecek
    passiveStudents: 0// 🚀 Canlı gelecek
  });

  useEffect(() => {
    // 1. Kullanıcı Bilgilerini Çek
    const storedName = localStorage.getItem('fullName');
    const storedRole = localStorage.getItem('userRole');

    if (storedName) setAdminName(storedName.toUpperCase());
    if (storedRole) setAdminRole(storedRole);

    // 2. 🚀 GERÇEK İSTATİSTİKLERİ ÇEK
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('jwtToken');
        
        // Daha önce yazdığımız tüm kullanıcıları getiren endpoint'i kullanıyoruz
        const response = await axios.get('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Auth/all-users', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const allUsers = response.data;

        // Rollerine göre sayıları buluyoruz
        const teacherCount = allUsers.filter(u => u.role === 'Instructor').length;
        const studentCount = allUsers.filter(u => u.role === 'Student').length;

        // İstatistikleri güncelliyoruz
        setDynamicStats(prev => ({
          ...prev,
          teachers: teacherCount,
          students: studentCount,
          activeStudents: studentCount, // Şimdilik hepsini aktif sayıyoruz
          passiveStudents: 0
        }));

      } catch (error) {
        console.error("İstatistikler alınırken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const handleLogout = () => {
    localStorage.clear(); 
    navigate('/');
  };

  // Ekrana Basılacak Kart Verilerini Dinamik State'ten Alıyoruz
  const statsArray = [
    { title: 'Toplam Fakülte', count: dynamicStats.faculties, icon: <FaUniversity />, color: '#ff9800' },
    { title: 'Toplam Bölüm', count: dynamicStats.departments, icon: <FaBuilding />, color: '#9c27b0' },
    { title: 'Toplam Ders', count: dynamicStats.courses, icon: <FaBook />, color: '#9c27b0' },
    { title: 'Toplam Öğretmen', count: dynamicStats.teachers, icon: <FaChalkboardTeacher />, color: '#039be5' },
    { title: 'Toplam Öğrenci', count: dynamicStats.students, icon: <FaUserFriends />, color: '#039be5' },
    { title: 'Aktif Öğrenci', count: dynamicStats.activeStudents, icon: <FaCheckCircle />, color: '#4caf50' },
    { title: 'Pasif Öğrenci', count: dynamicStats.passiveStudents, icon: <FaTimesCircle />, color: '#f44336' },
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
            <h3>{adminName}</h3>
            <span className="user-role">{adminRole}</span>
          </div>
        </div>
        <span className="status-badge">AKTİF</span>
      </div>

      {/* İstatistik Başlığı */}
      <h2 className="section-title">Sistem İstatistikleri</h2>

      {/* İstatistik Grid Yapısı */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666', fontSize: '18px' }}>
           <FaSpinner className="fa-spin" style={{ marginRight: '10px' }} />
           İstatistikler hesaplanıyor...
        </div>
      ) : (
        <div className="stats-grid">
          {statsArray.map((stat, index) => (
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
      )}
    </DashboardLayout>
  );
};

export default DashboardHome;