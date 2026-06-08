import React, { useState, useEffect } from 'react';
import { FaSignOutAlt, FaGraduationCap, FaSpinner } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './StudentAttendance.css';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const StudentAttendance = () => {
  const navigate = useNavigate();
  
  // State'ler
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        
        // 1. ADIM: Öğrencinin aldığı tüm dersleri çek
        const coursesResponse = await axiosInstance.get('/Attendance/student/my-courses');
        const courses = coursesResponse.data;

        // 2. ADIM: Her ders için eşzamanlı olarak (paralel) yoklama geçmişini çek
        const statsPromises = courses.map(async (course) => {
          try {
            const historyResponse = await axiosInstance.get(`/Attendance/student/history/${course.id}`);
            const history = historyResponse.data;

            // Toplam yapılan oturum sayısı ve "Present" (Var) olarak işaretlenen oturumları hesapla
            const totalSessions = history.length;
            const attendedSessions = history.filter(record => record.status === 'Present').length;

            return {
              id: course.id,
              title: course.courseName,
              details: `${course.courseCode} - ${course.instructorName}`,
              attended: attendedSessions,
              total: totalSessions
            };
          } catch (error) {
            console.error(`${course.courseCode} için geçmiş alınamadı:`, error);
            // Hata olursa en azından dersi sıfır veriyle gösterelim
            return {
              id: course.id,
              title: course.courseName,
              details: `${course.courseCode} - ${course.instructorName}`,
              attended: 0,
              total: 0
            };
          }
        });

        // Tüm derslerin geçmişinin yüklenmesini bekle
        const coursesWithStats = await Promise.all(statsPromises);
        setAttendanceData(coursesWithStats);

      } catch (err) {
        console.error("Dersler yüklenirken ana hata oluştu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

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
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <FaSpinner className="fa-spin" size={30} style={{ marginBottom: '15px', color: '#3b82f6' }} />
                <p>Yoklama verileriniz hesaplanıyor, lütfen bekleyin...</p>
              </div>
            ) : attendanceData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <p>Kayıtlı olduğunuz bir ders bulunamadı.</p>
              </div>
            ) : (
              attendanceData.map((item) => (
                <div key={item.id} className="attendance-row">
                  
                  {/* Sol Taraf: Ders Bilgisi */}
                  <div className="course-info">
                    <h3 className="course-name">{item.title}</h3>
                    <span className="course-meta">{item.details}</span>
                  </div>

                  {/* Sağ Taraf: Yoklama Kutusu */}
                  <div className="attendance-badge">
                    <span className="badge-count" style={{ 
                      // Devamsızlık %30'dan fazlaysa (örnek: katılım < %70) rengi kırmızı yapabilirsin
                      color: (item.total > 0 && (item.attended / item.total) < 0.7) ? '#ef4444' : '#10b981'
                    }}>
                      {item.attended} / {item.total}
                    </span>
                    <span className="badge-label">Katılım</span>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      </div>

    </DashboardLayout>
  );
};

export default StudentAttendance;