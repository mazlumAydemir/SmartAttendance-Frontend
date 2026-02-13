import React, { useEffect, useState } from 'react';
import { FaSignOutAlt, FaGraduationCap } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './Student.css';
import { useNavigate } from 'react-router-dom';

const StudentHome = () => {
  const navigate = useNavigate();
  
  // State Tanımları
  const [studentName, setStudentName] = useState("ÖĞRENCİ KULLANICI");
  const [studentInitials, setStudentInitials] = useState("ÖK");
  const [studentNo, setStudentNo] = useState("23000000"); // Öğrenci no varsa eklenebilir

  useEffect(() => {
    // 1. Bilgileri LocalStorage'dan Çek
    const storedName = localStorage.getItem('fullName');
    // const storedRole = localStorage.getItem('userRole');

    if (storedName) {
      const upperName = storedName.toUpperCase();
      setStudentName(upperName);

      // 2. İsimden Baş Harfleri Çıkarma (Örn: HALİL İBRAHİM -> Hİ)
      const initials = upperName
        .split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2); // En fazla 2 harf al
      setStudentInitials(initials);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear(); // Tüm verileri temizle
    navigate('/');
  };

  const semesterCourses = [
    { id: 1, title: 'Database Management Systems', details: 'BLGM353 PROFESSOR DR. EKREM VAROĞLU' },
    { id: 2, title: 'Algoritmaların Çözümlenmesi', details: 'BLGM371 ASST. PROF.DR. AHMET ÜNVEREN' },
    { id: 3, title: 'Mezuniyet Projesi - I', details: 'BLGM405 ASST. PROF.DR. AHMET ÜNVEREN' },
    { id: 4, title: 'Mobile Application Development', details: 'BLGM419 TBA TBA' },
    { id: 5, title: 'Data Science', details: 'BLGM428 PROF. DR. MEHMET YILMAZ' },
    { id: 6, title: 'İktisada Giriş - I', details: 'EKON111 ASST. PROF.DR. FATMA DEMİR' }
  ];

  return (
    <DashboardLayout role="student">
      
      <header className="dashboard-header">
        <h1>Ana Sayfa</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={handleLogout}/>
        </div>
      </header>

      {/* Öğrenci Bilgi Kartı */}
      <div className="student-welcome-card">
        <div className="student-info-left">
          
          {/* Dinamik Baş Harfler */}
          <div className="student-avatar-box">
            {studentInitials}
          </div>
          
          <div>
            {/* Dinamik İsim */}
            <h3>{studentName}</h3>
            <span className="student-no">{studentNo}</span>
          </div>
        </div>
      </div>

      {/* Ders Listesi */}
      <div className="courses-container-card">
        <div className="courses-card-header">
          <FaGraduationCap className="courses-header-icon" />
          <h2>Dönem Dersleri</h2>
        </div>

        <div className="course-list">
          {semesterCourses.map((course) => (
            <div key={course.id} className="course-item">
              <h3 className="course-title">{course.title}</h3>
              <p className="course-details">{course.details}</p>
            </div>
          ))}
        </div>
      </div>

    </DashboardLayout>
  );
};

export default StudentHome;