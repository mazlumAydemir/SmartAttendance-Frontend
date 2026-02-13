import React, { useEffect, useState } from 'react';
import { FaSignOutAlt, FaGraduationCap, FaSpinner, FaExclamationCircle } from 'react-icons/fa'; // Yeni ikonlar eklendi
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // API isteği için
import DashboardLayout from '../../layouts/DashboardLayout';
import './Teacher.css';

const TeacherHome = () => {
  const navigate = useNavigate();

  // --- STATE TANIMLARI ---
  const [teacherName, setTeacherName] = useState('ÖĞRETMEN KULLANICI');
  const [teacherRole, setTeacherRole] = useState('Akademisyen');
  
  // Dersler için state
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. KULLANICI BİLGİLERİNİ ÇEKME ---
  useEffect(() => {
    const storedName = localStorage.getItem('fullName');
    const storedRole = localStorage.getItem('userRole');

    if (storedName) setTeacherName(storedName.toUpperCase());
    if (storedRole) setTeacherRole(storedRole);
  }, []);

  // --- 2. API'DEN DERSLERİ ÇEKME ---
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('jwtToken');

        // Token yoksa login'e at
        if (!token) {
          navigate('/');
          return;
        }

        // API İsteği
        const response = await axios.get('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/my-courses', {
          headers: {
            'Authorization': `Bearer ${token}` // Token'ı header'a ekle
          }
        });

        // Başarılı ise veriyi kaydet
        setCourses(response.data);
        setError(null);

      } catch (err) {
        console.error("Dersler çekilemedi:", err);
        setError("Ders listesi yüklenirken bir hata oluştu.");
        
        // Eğer 401 (Yetkisiz) hatası alırsak oturumu kapat
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.clear();
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [navigate]);

  // Çıkış Fonksiyonu
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <DashboardLayout role="teacher">
      
      <header className="dashboard-header">
        <h1>Ana Sayfa</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={handleLogout} />
        </div>
      </header>

      {/* Profil Kartı */}
      <div className="teacher-welcome-card">
        <div className="teacher-info-left">
          <div className="teacher-avatar-circle">
            <FaGraduationCap />
          </div>
          <div>
            <h3>{teacherName}</h3>
            <span className="teacher-role">{teacherRole}</span>
          </div>
        </div>
        <span className="status-badge">AKTİF</span>
      </div>

      {/* Ders Listesi Kartı */}
      <div className="courses-container-card">
        
        <div className="courses-card-header">
          <FaGraduationCap className="courses-header-icon" />
          <h2>Atanan Derslerim</h2>
        </div>

        {/* --- DURUM YÖNETİMİ (Yükleniyor / Hata / Liste) --- */}
        
        {/* 1. Yükleniyor */}
        {loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <FaSpinner className="fa-spin" style={{ marginRight: '10px' }} />
            Dersler yükleniyor...
          </div>
        )}

        {/* 2. Hata */}
        {error && !loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#dc3545' }}>
            <FaExclamationCircle style={{ marginRight: '10px' }} />
            {error}
          </div>
        )}

        {/* 3. Liste Boşsa */}
        {!loading && !error && courses.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            Henüz atanmış bir dersiniz bulunmamaktadır.
          </div>
        )}

        {/* 4. Ders Listesi (API Verisi) */}
        {!loading && !error && courses.length > 0 && (
          <div className="course-list">
            {courses.map((course) => (
              <div key={course.id} className="course-item">
                {/* Backend'den gelen: CourseName */}
                <h3 className="course-title">{course.courseName}</h3>
                
                {/* Backend'den gelen: CourseCode */}
                <p className="course-details">
                  {course.courseCode} 
                  {/* İsterseniz buraya hocanın kendi adını da ekleyebilirsiniz */}
                  <span style={{ marginLeft: '10px', color: '#999', fontSize: '12px' }}>
                    - {teacherName}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}

      </div>

    </DashboardLayout>
  );
};

export default TeacherHome;