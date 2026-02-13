import React from 'react';
import { FaSignOutAlt, FaGraduationCap } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './StudentAttendance.css';
import { useNavigate } from 'react-router-dom';
const StudentAttendance = () => {
    const navigate = useNavigate();
  // Görseldeki Veriler
  const attendanceData = [
    {
      id: 1,
      title: "Database Management Systems",
      details: "BLGM353 PROFESSOR DR. EKREM VAROĞLU",
      attended: 0,
      total: 0
    },
    {
      id: 2,
      title: "Algoritmaların Çözümlenmesi",
      details: "BLGM371 ASST. PROF.DR. AHMET ÜNVEREN",
      attended: 10,
      total: 16
    },
    {
      id: 3,
      title: "Mezuniyet Projesi - I",
      details: "BLGM405 ASST. PROF.DR. AHMET ÜNVEREN",
      attended: 0,
      total: 0
    },
    {
      id: 4,
      title: "Mobile Application Development",
      details: "BLGM419 TBA TBA",
      attended: 0,
      total: 0
    },
    {
      id: 5,
      title: "Data Science",
      details: "BLGM428 PROF. DR. MEHMET YILMAZ",
      attended: 6,
      total: 7
    },
    {
      id: 6,
      title: "İktisada Giriş - I",
      details: "EKON111 ASST. PROF.DR. FATMA DEMİR",
      attended: 7,
      total: 15
    }
  ];

  return (
    <DashboardLayout role="student">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Yoklama Durumu</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
        </div>
      </header>

      {/* Ana Kart */}
      <div className="attendance-page-container">
        <div className="attendance-main-card">
          
          {/* Kart Başlığı */}
          <div className="card-header-row">
            <FaGraduationCap className="header-icon-blue" />
            <h2 className="header-title-blue">Dönem Dersleri</h2>
          </div>

          {/* Liste */}
          <div className="attendance-list">
            {attendanceData.map((item) => (
              <div key={item.id} className="attendance-row">
                
                {/* Sol Taraf: Ders Bilgisi */}
                <div className="course-info">
                  <h3 className="course-name">{item.title}</h3>
                  <span className="course-meta">{item.details}</span>
                </div>

                {/* Sağ Taraf: Yoklama Kutusu */}
                <div className="attendance-badge">
                  <span className="badge-count">{item.attended} / {item.total}</span>
                  <span className="badge-label">Yoklama</span>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>

    </DashboardLayout>
  );
};

export default StudentAttendance;