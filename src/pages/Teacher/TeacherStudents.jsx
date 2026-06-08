import React, { useState, useEffect } from 'react';
import { FaSignOutAlt, FaChevronRight, FaChevronDown, FaSpinner } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './TeacherStudents.css'; 
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance'; // Kendi API dosyan

const TeacherStudents = () => {
  const navigate = useNavigate();
  
  // STATELER
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // 1. ADIM: Sayfa Yüklendiğinde Hocanın Derslerini Çek
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // TeacherAttendance sayfasında da kullandığımız ders getirme endpointi
        const response = await axiosInstance.get('/Attendance/my-courses');
        setCourses(response.data);
        
        // Eğer hocanın dersi varsa, ilk dersi varsayılan olarak seç
        if (response.data.length > 0) {
          setSelectedCourse(response.data[0].id.toString());
        }
      } catch (error) {
        console.error("Dersler yüklenirken hata oluştu:", error);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  // 2. ADIM: Seçili Ders Değiştiğinde O Dersin Öğrencilerini Çek
  useEffect(() => {
    if (!selectedCourse) return;

    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        // Backend'deki GetStudentsByCourseIdAsync metoduna denk gelen endpoint.
        // DİKKAT: Controller'ındaki route farklıysa burayı ona göre güncelle!
        // DÜZELTİLMİŞ SATIR BURASI
const response = await axiosInstance.get(`/Attendance/instructor-course-students/${selectedCourse}`);
        setStudents(response.data);
      } catch (error) {
        console.error("Öğrenciler yüklenirken hata:", error);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedCourse]);

  // Yardımcı Fonksiyon: İsimden Baş Harfleri Bulma (Örn: HALİL İBRAHİM FİLOĞLU -> HF)
  const getInitials = (fullName) => {
    if (!fullName) return '??';
    const nameArray = fullName.trim().split(' ');
    if (nameArray.length === 1) return nameArray[0].charAt(0).toUpperCase();
    return (nameArray[0].charAt(0) + nameArray[nameArray.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <DashboardLayout role="teacher">
      {/* Üst Header */}
      <header className="dashboard-header">
        <h1>Öğrencilerim</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
        </div>
      </header>

      {/* Sayfa Başlığı */}
      <h2 className="page-sub-title">Öğrencilerim</h2>

      {/* Ders Seçim Kartı */}
      <div className="filter-card">
        <div className="select-wrapper">
            <span className="small-label">Ders Seçimi</span>
            
            {loadingCourses ? (
                <div style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaSpinner className="fa-spin" /> Dersler yükleniyor...
                </div>
            ) : (
                <>
                    <select 
                        className="course-select"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                        {courses.length === 0 && <option value="">Ders bulunamadı</option>}
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>
                                {course.courseCode} - {course.courseName}
                            </option>
                        ))}
                    </select>
                    <FaChevronDown className="select-arrow" />
                </>
            )}
        </div>
      </div>

      {/* Öğrenci Listesi Kartı */}
      <div className="student-list-card">
        <div className="card-header">
            <h3>Öğrenci Listesi</h3>
            {!loadingStudents && students.length > 0 && (
                <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '4px 10px', borderRadius: '12px' }}>
                    Toplam: {students.length} Öğrenci
                </span>
            )}
        </div>
        
        <div className="student-list">
          {loadingStudents ? (
             <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                 <FaSpinner className="fa-spin" size={24} style={{ marginBottom: '10px' }} />
                 <p>Öğrenciler getiriliyor...</p>
             </div>
          ) : students.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                 <p>Bu derse kayıtlı öğrenci bulunmamaktadır.</p>
             </div>
          ) : (
            students.map((student) => (
              <div key={student.id} className="student-item">
                
                {/* Sol Taraf: Avatar ve Bilgiler */}
                <div className="student-info-group">
                  <div className="student-avatar" style={{ background: '#3b82f6', color: 'white' }}>
                    {getInitials(student.fullName)}
                  </div>
                  <div className="student-details">
                    <span className="student-name">{student.fullName}</span>
                    <span className="student-subtext">Öğrenci No: {student.schoolNumber || '-'}</span>
                    <span className="student-subtext">{student.email}</span>
                  </div>
                </div>

                {/* Sağ Taraf: Ok İkonu */}
                <div className="student-action" style={{ cursor: 'pointer' }}>
                  <FaChevronRight color="#cbd5e1" />
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </DashboardLayout>
  );
};

export default TeacherStudents;