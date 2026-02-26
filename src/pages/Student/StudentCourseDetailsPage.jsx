import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';

import "./StudentCourseDetailsPage.css";

const StudentCourseDetailsPage = () => {
  const { courseId } = useParams();
  
  const [history, setHistory] = useState([]);
  const [courseInfo, setCourseInfo] = useState({ name: '', code: '' });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, excused: 0, total: 0, percentage: 0 });

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const coursesRes = await axios.get('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/student/my-courses', config);
      const currentCourse = coursesRes.data.find(c => c.id.toString() === courseId.toString());
      if (currentCourse) {
        setCourseInfo({ name: currentCourse.courseName, code: currentCourse.courseCode });
      }

      const historyRes = await axios.get(`https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/student/history/${courseId}`, config);
      setHistory(historyRes.data);
      calculateStats(historyRes.data);

    } catch (err) {
      console.error("Veri yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    let p = 0, a = 0, e = 0;
    data.forEach(item => {
      if (item.status === 'Present') p++;
      else if (item.status === 'Absent') a++;
      else if (item.status === 'Excused') e++;
    });
    const total = data.length;
    const percentage = total > 0 ? Math.round((p / total) * 100) : 0;
    setStats({ present: p, absent: a, excused: e, total, percentage });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('tr-TR', { month: 'short' }),
      full: date.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const renderStatusBadge = (status) => {
    if (status === 'Present') return <span className="status-badge status-present">VAR</span>;
    if (status === 'Absent') return <span className="status-badge status-absent">YOK</span>;
    if (status === 'Excused') return <span className="status-badge status-excused">İZİNLİ</span>;
    return <span className="status-badge" style={{backgroundColor: '#eee', color:'#999'}}>-</span>;
  };

  return (
    <DashboardLayout role="student">
      <div className="details-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <FaSpinner className="spinner-animation" style={{ fontSize: '30px', color: '#007bff' }} />
            <p style={{ color: '#666', marginTop: '10px' }}>Veriler yükleniyor...</p>
          </div>
        ) : (
          <>
            <div className="summary-card">
              <div className="course-header">
                <h2>{courseInfo.code} - {courseInfo.name}</h2>
                <p>Genel Devamsızlık Durumu</p>
              </div>
              
              <div className="stats-row">
                <div className="stat-box">
                  <span className="stat-number text-green">{stats.present}</span>
                  <span className="stat-label">Var</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number text-red">{stats.absent}</span>
                  <span className="stat-label">Yok</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number text-orange">{stats.excused}</span>
                  <span className="stat-label">İzinli</span>
                </div>
                <div className="stat-box" style={{ borderColor: '#007bff', backgroundColor: '#e7f1ff' }}>
                  <span className="stat-number" style={{ color: '#007bff' }}>%{stats.percentage}</span>
                  <span className="stat-label">Katılım</span>
                </div>
              </div>
            </div>

            <h3 style={{ color: '#444', marginBottom: '15px', fontSize: '18px' }}>
              Yoklama Geçmişi ({stats.total} Ders)
            </h3>
            
            {history.length === 0 ? (
              <div className="empty-state">Henüz bu ders için işlenmiş bir yoklama kaydı bulunmuyor.</div>
            ) : (
              <div className="history-list">
                {history.map((item) => {
                  const date = formatDate(item.startTime);
                  return (
                    <div key={item.sessionId} className="history-item">
                      <div className="item-left">
                        <div className="date-box">
                          <span className="date-day">{date.day}</span>
                          <span className="date-month">{date.month}</span>
                        </div>
                        
                        <div className="session-info">
                          <h4>{date.full}</h4>
                          <p>
                            Saat: <strong>{date.time}</strong> • Yöntem: {item.method}
                          </p>
                        </div>
                      </div>

                      <div className="item-right">
                        {renderStatusBadge(item.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      <style>{`
        .spinner-animation { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
};

export default StudentCourseDetailsPage;