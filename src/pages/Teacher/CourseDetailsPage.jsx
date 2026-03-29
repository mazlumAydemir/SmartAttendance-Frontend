import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaChalkboardTeacher, FaHistory, FaCalendarAlt, 
  FaSpinner, FaTimes, FaCheck, FaTimes as FaCross, FaMinus,
  FaUserGraduate, FaCog, FaSave, FaToggleOn 
} from 'react-icons/fa';
import axios from 'axios';
import DashboardLayout from '../../layouts/DashboardLayout';
import './CourseDetails.css';

const CourseDetailsPage = () => {
  const { courseId } = useParams();
  
  // --- GENEL STATE ---
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [pastSessions, setPastSessions] = useState([]);
  const [studentStats, setStudentStats] = useState([]);
  
  const [allUsers, setAllUsers] = useState([]);

  // --- AYARLAR STATE ---
  const [settings, setSettings] = useState({
    isAutoAttendanceEnabled: false,
    defaultMethod: 1, 
    defaultDurationMinutes: 30,
    defaultRadiusMeters: 50 // Backend'e göndermek için state'te tutuyoruz ama ekranda göstermiyoruz
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSessionStudents, setSelectedSessionStudents] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedSessionInfo, setSelectedSessionInfo] = useState(null);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 0. TÜM KULLANICILARI ÇEK
      try {
        const usersRes = await axios.get('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Auth/all-users', config);
        setAllUsers(usersRes.data);
      } catch (e) {
        console.warn("Tüm kullanıcılar çekilemedi.");
      }

      // 1. DERS ADINI BUL
      const coursesRes = await axios.get('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Attendance/my-courses', config);
      const currentCourse = coursesRes.data.find(c => c.id.toString() === courseId);
      
      let targetCourseName = "";
      if (currentCourse) {
        setCourseTitle(currentCourse.courseName);
        setCourseCode(currentCourse.courseCode);
        targetCourseName = currentCourse.courseCode;
      }

      // 2. ÖĞRENCİ İSTATİSTİKLERİ
      let validStudentIds = [];
      try {
        const statsRes = await axios.get(`https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Attendance/instructor/course-stats/${courseId}`, config);
        setStudentStats(statsRes.data);
        validStudentIds = statsRes.data.map(s => s.studentId);
      } catch (e) { console.warn("İstatistik çekilemedi."); }

      // 3. GEÇMİŞ OTURUMLARI ÇEK
      const sessionRes = await axios.get('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Attendance/instructor/history/sessions', config);
      
      const filteredSessions = sessionRes.data.filter(session => {
        if (!targetCourseName || !session.courseNames) return false;
        const sessionCourseList = session.courseNames.split(',').map(name => name.trim());
        return sessionCourseList.includes(targetCourseName);
      });

      // 4. İSTATİSTİKLERİ SADECE BU DERS İÇİN HESAPLA
      const sessionsWithExactStats = await Promise.all(filteredSessions.map(async (session) => {
        try {
          const detailRes = await axios.get(`https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Attendance/instructor/history/session-details/${session.sessionId}`, config);
          
          const courseStudentsInSession = detailRes.data.filter(student => validStudentIds.includes(student.studentId));

          const exactTotal = validStudentIds.length;
          const exactAttended = courseStudentsInSession.filter(s => s.status === 'Present').length;

          return {
            ...session,
            exactTotal: exactTotal,
            exactAttended: exactAttended
          };
        } catch (err) {
          return { ...session, exactTotal: validStudentIds.length, exactAttended: 0 };
        }
      }));

      setPastSessions(sessionsWithExactStats);

      // 5. AYARLARI ÇEK
      try {
        const settingsRes = await axios.get(`https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Attendance/instructor/course-settings/${courseId}`, config);
        setSettings(settingsRes.data);
      } catch (e) { console.warn("Ayarlar çekilemedi."); }

    } catch (err) {
      console.error("Veri hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.put('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Attendance/instructor/course-settings/update', {
        courseId: parseInt(courseId),
        ...settings,
        defaultMethod: parseInt(settings.defaultMethod)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ Ayarlar başarıyla güncellendi!");
    } catch (err) {
      alert("❌ Ayarlar kaydedilemedi.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const openAttendanceModal = async (session) => {
    setSelectedSessionInfo(session);
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(`https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Attendance/instructor/history/session-details/${session.sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const validStudentIds = studentStats.map(s => s.studentId);
      const filteredModalStudents = response.data.filter(student => validStudentIds.includes(student.studentId));

      setSelectedSessionStudents(filteredModalStudents);
    } catch (err) { console.error(err); } 
    finally { setModalLoading(false); }
  };

  const handleStatusChange = async (studentId, newStatus) => {
    const updatedList = selectedSessionStudents.map(student => 
      student.studentId === studentId ? { ...student, status: newStatus } : student
    );
    setSelectedSessionStudents(updatedList);
    
    let statusInt = 1;
    if (newStatus === 'Absent') statusInt = 2;
    if (newStatus === 'Excused') statusInt = 3;

    try {
      const token = localStorage.getItem('jwtToken');
      await axios.post('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Attendance/update-status', {
        sessionId: selectedSessionInfo.sessionId, studentId, status: statusInt, description: "Manuel güncelleme"
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { alert("Hata: Güncellenemedi."); }
  };

  const getSessionStats = () => {
    if (!selectedSessionStudents) return { present: 0, absent: 0, excused: 0 };
    return {
      present: selectedSessionStudents.filter(s => s.status === 'Present').length,
      absent: selectedSessionStudents.filter(s => s.status === 'Absent' || s.status === 'NotMarked').length,
      excused: selectedSessionStudents.filter(s => s.status === 'Excused').length
    };
  };
  const sessionStats = getSessionStats();

  const resolveSchoolNumber = (studentId, currentNumber) => {
    if (currentNumber && currentNumber !== "-" && currentNumber !== "No Number" && currentNumber !== "") {
      return currentNumber;
    }
    const foundUser = allUsers.find(u => u.id === studentId);
    return foundUser?.schoolNumber ? foundUser.schoolNumber : "-";
  };

  return (
    <DashboardLayout role="teacher">
      <div className="course-details-container">
        
        <div className="course-header-card">
            <div className="header-icon-wrapper">
              <FaChalkboardTeacher /> 
            </div>
            <div style={{ flex: 1 }}>
              <h2 className="course-title">
                {courseCode ? `${courseCode} - ${courseTitle}` : `Ders ID: ${courseId}`}
              </h2>
              <p className="course-subtitle">Ders genel durumu, geçmiş yoklamalar ve ayarlar</p>
            </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}><FaSpinner className="spinner-animation" /> Yükleniyor...</div>
        ) : (
          <>
            {/* 1. SINIF LİSTESİ */}
            <div className="student-list-card">
              <div className="list-header">
                <FaUserGraduate style={{ color: '#555' }} />
                <h3>Genel Sınıf Listesi ve Devamlılık</h3>
              </div>
              <div className="table-scroll-area">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Öğrenci Adı</th>
                      <th>Numara</th>
                      <th>Katılım</th>
                      <th>Oran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentStats.length === 0 ? (
                       <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#999' }}>Bu derse kayıtlı öğrenci bulunamadı.</td></tr>
                    ) : (
                      studentStats.map((student) => (
                        <tr key={student.studentId}>
                          <td style={{ fontWeight: 'bold' }}>{student.studentName}</td>
                          <td style={{ color: '#666' }}>{resolveSchoolNumber(student.studentId, student.schoolNumber)}</td>
                          <td><strong>{student.attendedSessions}</strong> <span style={{ color: '#999' }}>/ {student.totalSessions} Ders</span></td>
                          <td style={{ width: '35%' }}>
                            <div className="progress-wrapper" style={{ marginBottom: 0 }}>
                              <div className="progress-track">
                                <div className="progress-fill" style={{ 
                                  width: `${student.attendancePercentage}%`, 
                                  backgroundColor: student.attendancePercentage >= 70 ? '#4caf50' : student.attendancePercentage >= 50 ? '#ff9800' : '#f44336'
                                }}></div>
                              </div>
                              <div style={{ fontSize: '11px', textAlign: 'right', marginTop: '2px' }}>%{student.attendancePercentage}</div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. GEÇMİŞ YOKLAMALAR */}
            <div className="section-title">
               <FaHistory style={{ color: '#555' }} />
               <h3 style={{ margin: 0, fontSize: '18px' }}>Geçmiş Yoklamalar</h3>
            </div>

            {pastSessions.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '10px', border: '1px dashed #ccc' }}>Henüz tamamlanmış bir yoklama yok.</div>
            ) : (
              <div className="sessions-grid">
                {pastSessions.map((session) => {
                  const total = session.exactTotal || 0;
                  const attended = session.exactAttended || 0;
                  
                  let percentage = 0;
                  if (total > 0) percentage = Math.round((attended / total) * 100);
                  const barColor = percentage >= 70 ? '#28a745' : percentage >= 40 ? '#ffc107' : '#dc3545';

                  return (
                    <div key={session.sessionId} className="session-card">
                      <div className="card-top-row">
                        <span className="session-time-text">{new Date(session.startTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="method-badge">{session.method}</span>
                      </div>
                      <div className="session-date-row">
                        <FaCalendarAlt className="calendar-icon" />
                        <span>{new Date(session.startTime).toLocaleDateString('tr-TR')}</span>
                      </div>
                      
                      <div style={{fontSize: '12px', color:'#777', marginBottom:'10px', fontWeight:'bold'}}>
                        {courseCode}
                      </div>

                      <div className="attendance-text-row">
                         <span className="attendance-label">Katılım Durumu</span>
                         <span className="attendance-value" style={{ color: barColor }}>Var: {attended} / {total}</span>
                      </div>
                      <div className="progress-track">
                         <div className="progress-fill" style={{ width: `${percentage}%`, backgroundColor: barColor }}></div>
                      </div>
                      <div className="percentage-text">%{percentage} Katılım</div>
                      <button onClick={() => openAttendanceModal(session)} className="detail-btn">Detayları Görüntüle</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. AYARLAR (ÇİFT KOPYA SİLİNDİ, TEKE DÜŞÜRÜLDÜ VE YARIÇAP KALDIRILDI) */}
            <div className="settings-section">
              <div className="section-title">
                <FaCog style={{ color: '#555' }} />
                <h3 style={{ margin: 0, fontSize: '18px' }}>Otomatik Yoklama Yapılandırması</h3>
              </div>

              <div className="settings-card">
                <div className="settings-header">
                  <h3><FaToggleOn /> Otomatik Başlatma Ayarları</h3>
                  <span style={{ fontSize: '13px', color: '#666' }}>Bu ayarlar ders programındaki saatte yoklamayı otomatik başlatır.</span>
                </div>
                
                <div className="settings-content">
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Otomatik Yoklamayı Etkinleştir</h4>
                      <p>Aktif edilirse sistem ders saatinde yoklamayı sizin yerinize başlatır.</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.isAutoAttendanceEnabled} 
                        onChange={(e) => setSettings({...settings, isAutoAttendanceEnabled: e.target.checked})} 
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className={`settings-grid ${!settings.isAutoAttendanceEnabled ? 'disabled-area' : ''}`}>
                    <div className="input-group">
                      <label>Varsayılan Yöntem</label>
                      <select 
                        value={settings.defaultMethod} 
                        onChange={(e) => setSettings({...settings, defaultMethod: parseInt(e.target.value)})}
                        className="form-control"
                      >
                        <option value={1}>QR Kod</option>
                        <option value={2}>Konum (GPS)</option>
                        <option value={3}>Yüz Tanıma</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label>Yoklama Açık Kalma Süresi (Dakika)</label>
                      <input 
                        type="number" 
                        value={settings.defaultDurationMinutes}
                        onChange={(e) => setSettings({...settings, defaultDurationMinutes: parseInt(e.target.value)})}
                        className="form-control"
                        placeholder="Örn: 15"
                      />
                      <small style={{color: '#888'}}>Yoklama başladıktan kaç dakika sonra otomatik kapansın?</small>
                    </div>
                  </div>

                  <button 
                    onClick={saveSettings} 
                    className="save-btn-large" 
                    disabled={settingsLoading}
                  >
                    {settingsLoading ? <FaSpinner className="spinner-animation" /> : <FaSave />} 
                    Ayarları Kaydet
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MODAL PENCERESİ */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ margin: 0 }}>Yoklama Detayı ({new Date(selectedSessionInfo?.startTime).toLocaleDateString('tr-TR')})</h3>
                <FaTimes onClick={() => setIsModalOpen(false)} className="close-icon" />
              </div>
              <div className="modal-body">
                {modalLoading ? <div style={{ textAlign: 'center' }}><FaSpinner className="spinner-animation" /></div> : (
                  <>
                    <div className="stats-container">
                      <div className="stat-item"><div className="stat-circle present">{sessionStats.present}</div><small style={{ fontWeight: 'bold', color: '#2e7d32' }}>VAR</small></div>
                      <div className="stat-item"><div className="stat-circle absent">{sessionStats.absent}</div><small style={{ fontWeight: 'bold', color: '#c62828' }}>YOK</small></div>
                      <div className="stat-item"><div className="stat-circle excused">{sessionStats.excused}</div><small style={{ fontWeight: 'bold', color: '#ef6c00' }}>İZİNLİ</small></div>
                    </div>
                    <table className="student-table">
                       <tbody>
                        {selectedSessionStudents.length === 0 ? (
                            <tr><td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Bu dersin öğrencisi bu oturumda bulunmuyor.</td></tr>
                        ) : (
                          selectedSessionStudents.map((student, idx) => (
                            <tr key={idx}>
                              <td>
                                 <div style={{ fontWeight: 'bold' }}>{student.studentName}</div>
                                 <small style={{ color: '#999' }}>{resolveSchoolNumber(student.studentId, student.schoolNumber)}</small>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <div className="status-btn" onClick={() => handleStatusChange(student.studentId, 'Present')} style={{ backgroundColor: student.status === 'Present' ? '#4caf50' : '#f0f0f0', color: student.status === 'Present' ? '#fff' : '#ccc' }}><FaCheck /></div>
                                  <div className="status-btn" onClick={() => handleStatusChange(student.studentId, 'Absent')} style={{ backgroundColor: (student.status === 'Absent' || student.status === 'NotMarked') ? '#f44336' : '#f0f0f0', color: (student.status === 'Absent' || student.status === 'NotMarked') ? '#fff' : '#ccc' }}><FaCross /></div>
                                  <div className="status-btn" onClick={() => handleStatusChange(student.studentId, 'Excused')} style={{ backgroundColor: student.status === 'Excused' ? '#ff9800' : '#f0f0f0', color: student.status === 'Excused' ? '#fff' : '#ccc' }}><FaMinus /></div>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                       </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CourseDetailsPage;