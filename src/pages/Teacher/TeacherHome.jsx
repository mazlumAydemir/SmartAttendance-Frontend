import React, { useEffect, useState } from 'react';
import { FaSignOutAlt, FaGraduationCap, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../../layouts/DashboardLayout';
import './Teacher.css';

const TeacherHome = () => {
  const navigate = useNavigate();

  const [teacherName, setTeacherName] = useState('ÖĞRETMEN KULLANICI');
  const [teacherRole, setTeacherRole] = useState('Akademisyen');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedName = localStorage.getItem('fullName');
    const storedRole = localStorage.getItem('userRole');
    if (storedName) setTeacherName(storedName.toUpperCase());
    if (storedRole) setTeacherRole(storedRole);
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('jwtToken');

        if (!token) {
          navigate('/');
          return;
        }

        const response = await axios.get('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Attendance/my-courses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setCourses(response.data);
        setError(null);

      } catch (err) {
        console.error("Dersler çekilemedi:", err);
        setError("Ders listesi yüklenirken bir hata oluştu.");
        
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

      <div className="courses-container-card">
        <div className="courses-card-header">
          <FaGraduationCap className="courses-header-icon" />
          <h2>Atanan Derslerim</h2>
        </div>

        {loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <FaSpinner className="fa-spin" style={{ marginRight: '10px' }} />
            Dersler yükleniyor...
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#dc3545' }}>
            <FaExclamationCircle style={{ marginRight: '10px' }} />
            {error}
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            Henüz atanmış bir dersiniz bulunmamaktadır.
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="course-list">
            {courses.map((course) => (
              <div 
                key={course.id} 
                className="course-item"
                style={{ cursor: 'pointer' }} // Tıklanabilirlik imajı
                onClick={() => navigate(`/teacher/course/${course.id}`)} // Tıklanınca yönlendir
              >
                <h3 className="course-title">{course.courseName}</h3>
                <p className="course-details">
                  {course.courseCode} 
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