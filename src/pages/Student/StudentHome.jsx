import React, { useEffect, useState } from 'react';
import { FaSignOutAlt, FaGraduationCap, FaSpinner, FaBookOpen, FaChalkboardTeacher } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './Student.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentHome = () => {
  const navigate = useNavigate();
  
  const [studentName, setStudentName] = useState("ÖĞRENCİ");
  const [studentInitials, setStudentInitials] = useState("Ö");
  const [studentNo, setStudentNo] = useState(""); 
  const [courses, setCourses] = useState([]); 
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const storedName = localStorage.getItem('fullName');
    const storedNo = localStorage.getItem('schoolNumber'); 

    if (storedName) {
      const upperName = storedName.toUpperCase();
      setStudentName(upperName);
      const initials = upperName.split(' ').map(word => word[0]).join('').substring(0, 2);
      setStudentInitials(initials);
    }
    if(storedNo) setStudentNo(storedNo);

    fetchStudentCourses();
  }, []);

  const fetchStudentCourses = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/student/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
    } catch (err) {
      console.error("Dersler yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleCourseClick = (courseId) => {
    navigate(`/student/course-details/${courseId}`);
  };

  return (
    <DashboardLayout role="student">
      <header className="dashboard-header">
        <h1>Ana Sayfa</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={handleLogout} title="Çıkış Yap"/>
        </div>
      </header>

      <div className="student-welcome-card">
        <div className="student-info-left">
          <div className="student-avatar-box">{studentInitials}</div>
          <div>
            <h3>{studentName}</h3>
            <span className="student-no">{studentNo || "Öğrenci Paneli"}</span>
          </div>
        </div>
      </div>

      <div className="courses-container-card">
        <div className="courses-card-header">
          <FaGraduationCap className="courses-header-icon" />
          <h2>Dönem Dersleri</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <FaSpinner className="spinner-animation" style={{ fontSize: '24px', marginBottom: '10px', color: '#007bff' }} />
            <p>Dersler yükleniyor...</p>
          </div>
        ) : (
          <div className="course-list">
            {courses.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Henüz kayıtlı dersiniz yok.</div>
            ) : (
              courses.map((course) => (
                <div 
                  key={course.id} 
                  className="course-item clickable-course" 
                  onClick={() => handleCourseClick(course.id)}
                >
                  <div className="course-icon-wrapper">
                    <FaBookOpen />
                  </div>
                  <div className="course-info">
                    <h3 className="course-title">{course.courseName}</h3>
                    <div className="course-details">
                      <span style={{ fontWeight: 'bold', color: '#007bff', marginRight: '10px' }}>
                        {course.courseCode}
                      </span>
                      {/* --- YENİ EKLENEN: ÖĞRETMEN ADI --- */}
                      <span style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <FaChalkboardTeacher style={{ marginBottom: '1px' }}/> {course.instructorName}
                      </span>
                    </div>
                  </div>
                  <div className="arrow-icon">›</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        .spinner-animation { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .clickable-course { cursor: pointer; transition: transform 0.2s, background-color 0.2s; display: flex; align-items: center; gap: 15px; }
        .clickable-course:hover { transform: translateX(5px); background-color: #f8f9fa; }
        .course-icon-wrapper { background-color: #e7f1ff; color: #007bff; padding: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .course-info { flex: 1; }
        .course-details { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 4px; } 
        .arrow-icon { color: #ccc; font-size: 20px; font-weight: bold; }
      `}</style>
    </DashboardLayout>
  );
};

export default StudentHome;