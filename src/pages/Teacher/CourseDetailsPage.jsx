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

  // --- AYARLAR STATE (Sayfa Altı İçin) ---
  const [settings, setSettings] = useState({
    isAutoAttendanceEnabled: false,
    defaultMethod: 1, // 1:QRCode, 2:Location, 3:FaceScan
    defaultDurationMinutes: 30,
    defaultRadiusMeters: 50
  });
  const [settingsLoading, setSettingsLoading] = useState(false); // Kaydederken dönsün

  // --- MODAL STATE (Detay Popup) ---
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

      // 1. DERS ADINI BUL
      const coursesRes = await axios.get('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/my-courses', config);
      const currentCourse = coursesRes.data.find(c => c.id.toString() === courseId);
      
      let targetCourseName = "";
      if (currentCourse) {
        setCourseTitle(currentCourse.courseName);
        setCourseCode(currentCourse.courseCode);
        targetCourseName = currentCourse.courseCode;
      }

      // 2. GEÇMİŞ OTURUMLARI ÇEK
      const sessionRes = await axios.get('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/instructor/history/sessions', config);
      const filteredSessions = sessionRes.data.filter(session => 
        (targetCourseName && session.courseNames.includes(targetCourseName)) || 
        session.sessionId.toString() === courseId
      );
      setPastSessions(filteredSessions);

      // 3. ÖĞRENCİ İSTATİSTİKLERİ
      try {
        const statsRes = await axios.get(`https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/instructor/course-stats/${courseId}`, config);
        setStudentStats(statsRes.data);
      } catch (e) { console.warn("İstatistik çekilemedi."); }

      // 4. AYARLARI ÇEK (YENİ: Sayfa yüklenirken çekiyoruz)
      try {
        const settingsRes = await axios.get(`https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/instructor/course-settings/${courseId}`, config);
        setSettings(settingsRes.data);
      } catch (e) { console.warn("Ayarlar çekilemedi (Varsayılanlar kullanılıyor)."); }

    } catch (err) {
      console.error("Veri hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- AYARLARI KAYDET ---
  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.put('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/instructor/course-settings/update', {
        courseId: parseInt(courseId),
        ...settings,
        defaultMethod: parseInt(settings.defaultMethod)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert("✅ Ayarlar başarıyla güncellendi!");
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      alert("❌ Ayarlar kaydedilemedi.");
    } finally {
      setSettingsLoading(false);
    }
  };

  // --- MEVCUT MODAL İŞLEMLERİ ---
  const openAttendanceModal = async (session) => {
    setSelectedSessionInfo(session);
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(`https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/instructor/history/session-details/${session.sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedSessionStudents(response.data);
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
      await axios.post('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/update-status', {
        sessionId: selectedSessionInfo.sessionId, studentId, status: statusInt, description: "Manuel güncelleme"
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { alert("Hata: Güncellenemedi."); }
  };

  // Kart Hesaplamaları (Senin istediğin versiyon)
  const getSessionStats = () => {
    if (!selectedSessionStudents) return { present: 0, absent: 0, excused: 0 };
    return {
      present: selectedSessionStudents.filter(s => s.status === 'Present').length,
      absent: selectedSessionStudents.filter(s => s.status === 'Absent' || s.status === 'NotMarked').length,
      excused: selectedSessionStudents.filter(s => s.status === 'Excused').length
    };
  };
  const sessionStats = getSessionStats();

  return (
    <DashboardLayout role="teacher">
      <div className="course-details-container">
        
        {/* 1. Başlık Kartı */}
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
            {/* 2. Orta Kısım: Sınıf Listesi */}
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
                          <td style={{ color: '#666' }}>{student.schoolNumber}</td>
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

            {/* 3. Alt Kısım: Geçmiş Kartlar */}
            <div className="section-title">
               <FaHistory style={{ color: '#555' }} />
               <h3 style={{ margin: 0, fontSize: '18px' }}>Geçmiş Yoklamalar</h3>
            </div>

            {pastSessions.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '10px', border: '1px dashed #ccc' }}>Henüz tamamlanmış bir yoklama yok.</div>
            ) : (
              <div className="sessions-grid">
                {pastSessions.map((session) => {
                  const rawTotal = session.totalStudents !== undefined ? session.totalStudents : session.TotalStudents;
                  const rawAttended = session.attendedCount !== undefined ? session.attendedCount : session.AttendedCount;
                  const total = Number(rawTotal) || 0;
                  const attended = Number(rawAttended) || 0;
                  
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

            {/* 4. YENİ BÖLÜM: OTOMATİK YOKLAMA AYARLARI (EN ALTTA) */}
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
                  
                  {/* Toggle Switch */}
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

                  {/* Form Elemanları (Grid) */}
                  <div className={`settings-grid ${!settings.isAutoAttendanceEnabled ? 'disabled-area' : ''}`}>
                    
                    <div className="input-group">
                      <label>Varsayılan Yöntem</label>
                      <select 
                        value={settings.defaultMethod} 
                        onChange={(e) => setSettings({...settings, defaultMethod: e.target.value})}
                        className="form-control"
                      >
                        <option value={1}>QR Kod</option>
                        <option value={2}>Konum (GPS)</option>
                        <option value={3}>Yüz Tanıma</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label>Süre (Dakika)</label>
                      <input 
                        type="number" 
                        value={settings.defaultDurationMinutes}
                        onChange={(e) => setSettings({...settings, defaultDurationMinutes: parseInt(e.target.value)})}
                        className="form-control"
                      />
                    </div>

                    <div className="input-group">
                      <label>Konum Yarıçapı (Metre)</label>
                      <input 
                        type="number" 
                        value={settings.defaultRadiusMeters || 50}
                        onChange={(e) => setSettings({...settings, defaultRadiusMeters: parseInt(e.target.value)})}
                        className="form-control"
                        disabled={parseInt(settings.defaultMethod) === 1} // QR'da kapalı olsun
                      />
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

        {/* 5. MODAL (Değişmedi) */}
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
                        {selectedSessionStudents.map((student, idx) => (
                          <tr key={idx}>
                            <td><div style={{ fontWeight: 'bold' }}>{student.studentName}</div><small style={{ color: '#999' }}>{student.schoolNumber}</small></td>
                            <td>
                              <div className="action-buttons">
                                <div className="status-btn" onClick={() => handleStatusChange(student.studentId, 'Present')} style={{ backgroundColor: student.status === 'Present' ? '#4caf50' : '#f0f0f0', color: student.status === 'Present' ? '#fff' : '#ccc' }}><FaCheck /></div>
                                <div className="status-btn" onClick={() => handleStatusChange(student.studentId, 'Absent')} style={{ backgroundColor: (student.status === 'Absent' || student.status === 'NotMarked') ? '#f44336' : '#f0f0f0', color: (student.status === 'Absent' || student.status === 'NotMarked') ? '#fff' : '#ccc' }}><FaCross /></div>
                                <div className="status-btn" onClick={() => handleStatusChange(student.studentId, 'Excused')} style={{ backgroundColor: student.status === 'Excused' ? '#ff9800' : '#f0f0f0', color: student.status === 'Excused' ? '#fff' : '#ccc' }}><FaMinus /></div>
                              </div>
                            </td>
                          </tr>
                        ))}
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