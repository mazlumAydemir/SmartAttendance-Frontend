import React, { useState, useEffect, useCallback } from 'react';
import { FaSignOutAlt, FaList, FaStopCircle, FaInfoCircle, FaCalendarAlt, FaClock, FaCalendarDay, FaSpinner, FaHistory, FaBroadcastTower, FaTrash } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './TeacherReports.css';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import * as signalR from '@microsoft/signalr';

const TeacherReports = () => {
  const navigate = useNavigate();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [sessionStudents, setSessionStudents] = useState([]); 
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [hubConnection, setHubConnection] = useState(null);

  // ==========================================================
  // TÜM RAPORLARI GETİR
  // ==========================================================
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      const [activeRes, historyRes] = await Promise.all([
        axiosInstance.get('/Attendance/my-active-sessions'),
        axiosInstance.get('/Attendance/instructor/history/sessions')
      ]);

      const activeData = activeRes.data.map(item => ({
        sessionId: item.sessionId,
        sessionCode: item.sessionCode,
        startTime: item.startTime,
        methodName: item.methodName,
        courseNames: Array.isArray(item.courseNames) ? item.courseNames.join(', ') : item.courseNames,
        isActive: true, 
        attendedCount: 0, 
        totalStudents: 0
      }));

      const historyData = historyRes.data.map(item => ({
        sessionId: item.sessionId,
        sessionCode: "KAPALI",
        startTime: item.startTime,
        methodName: item.method, 
        courseNames: item.courseNames,
        isActive: false, 
        attendedCount: item.attendedCount,
        totalStudents: item.totalStudents
      }));

      const combined = [...activeData, ...historyData].sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
      );

      setReports(combined);

    } catch (error) {
      console.error("Veriler çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ==========================================================
  // YOKLAMA DURDUR & SİL
  // ==========================================================
  const handleStopSession = async (sessionId) => {
    const confirm = window.confirm("Bu yoklamayı kapatmak istediğinize emin misiniz? Öğrenciler artık giriş yapamayacak.");
    if (!confirm) return;

    try {
      await axiosInstance.post(`/Attendance/end/${sessionId}`, {});
      setReports(prevReports => 
        prevReports.map(report => 
          report.sessionId === sessionId ? { ...report, isActive: false } : report
        )
      );
      alert("✅ Yoklama başarıyla kapatıldı.");
    } catch (error) {
      alert("❌ İşlem başarısız: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteSession = async (sessionId) => {
    const isConfirmed = window.confirm("⚠️ DİKKAT: Bu yoklamayı tamamen silmek istediğinize emin misiniz? Öğrencilerin bu derse ait devamsızlık istatistikleri sıfırlanacaktır. Bu işlem geri alınamaz!");
    if (!isConfirmed) return;

    try {
      await axiosInstance.delete(`/Attendance/instructor/session/${sessionId}`);
      setReports(prevReports => prevReports.filter(report => report.sessionId !== sessionId));
      alert("✅ Yoklama başarıyla silindi!");
    } catch (error) {
      alert("❌ HATA: Yoklama silinemedi. " + (error.response?.data?.message || error.message));
    }
  };

  // ==========================================================
  // GLOBAL SİGNALR BAĞLANTISI (AÇIK/KAPALI DİNLEME)
  // ==========================================================
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/attendanceHub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log("[SignalR] Hoca ana bağlantısı kuruldu!");
        setHubConnection(connection);

        connection.on("SessionEndedGlobal", (sessionId) => {
          setReports(prev => prev.map(r => r.sessionId === sessionId ? { ...r, isActive: false } : r));
        });

        connection.on("SessionStarted", () => {
          console.log("[SignalR] Yeni oturum açıldı, liste güncelleniyor...");
          fetchAllData(); 
        });
      })
      .catch(err => console.error("[SignalR] Hoca Bağlantı Hatası:", err));

    return () => {
        connection.stop();
    };
  }, [fetchAllData]);

  // ==========================================================
  // ODA İÇİ SİGNALR DİNLEYİCİSİ (ÖĞRENCİ KATILIM ANLIK TAKİP)
  // ==========================================================
  useEffect(() => {
    if (hubConnection && expandedReportId) {
      hubConnection.invoke("JoinSessionGroup", expandedReportId.toString())
        .catch(err => console.error("[SignalR] Odaya girilemedi:", err));

      const handleStudentAttended = (param1) => {
        console.log("🔥 [SignalR] Yoklama Geldi! Ham Veri:", param1);

        let incomingId;
        let incomingStatus;

        // C# tarafı "new { StudentId = sId, Status = "Present" }" şeklinde obje atıyor.
        if (typeof param1 === 'object' && param1 !== null) {
          // Gelen objede büyük/küçük harf durumlarını garantiye alıyoruz
          incomingId = param1.studentId || param1.StudentId || param1.id || param1.Id;
          incomingStatus = param1.status || param1.Status;
        } else {
          console.warn("[SignalR] Beklenmeyen veri formatı!");
          return;
        }

        // Eğer backend enum sayısını atarsa diye önlem
        if (incomingStatus === 1 || incomingStatus === "1") incomingStatus = "Present";
        if (incomingStatus === 2 || incomingStatus === "2") incomingStatus = "Absent";
        if (incomingStatus === 3 || incomingStatus === "3") incomingStatus = "Excused";

        console.log(`✅ İşlenen Veri -> ID: ${incomingId}, Status: ${incomingStatus}`);

        // State'i güncelle (Sıkı eşitliğe yakalanmamak için ID'leri zorla String yapıyoruz)
        setSessionStudents(prevStudents => 
          prevStudents.map(student => 
            String(student.studentId) === String(incomingId) 
              ? { ...student, status: incomingStatus } 
              : student
          )
        );
      };

      hubConnection.on("StudentAttended", handleStudentAttended);

      return () => {
        hubConnection.off("StudentAttended", handleStudentAttended);
        hubConnection.invoke("LeaveSessionGroup", expandedReportId.toString())
          .catch(err => console.error("[SignalR] Odadan çıkılamadı:", err));
      };
    }
  }, [hubConnection, expandedReportId]);

  // ==========================================================
  // LİSTEYİ AÇ / KAPA VE ÖĞRENCİLERİ ÇEK
  // ==========================================================
  const toggleExpand = async (sessionId) => {
    if (expandedReportId === sessionId) {
      setExpandedReportId(null); 
      setSessionStudents([]);
    } else {
      setExpandedReportId(sessionId); 
      setLoadingStudents(true);
      try {
        const response = await axiosInstance.get(`/Attendance/full-class-list/${sessionId}`);
        setSessionStudents(response.data);
      } catch (error) {
        console.error("Öğrenci listesi alınamadı:", error);
        alert("Liste yüklenemedi. Lütfen internet bağlantınızı kontrol edin.");
      } finally {
        setLoadingStudents(false);
      }
    }
  };

  // ==========================================================
  // MANUEL DURUM GÜNCELLEME (HOCANIN EL İLE P/A/E YAPMASI)
  // ==========================================================
  const handleStatusUpdate = async (studentId, newStatusString, newStatusInt) => {
    const currentStudent = sessionStudents.find(s => s.studentId === studentId);
    if (currentStudent && currentStudent.status === newStatusString) return;

    // UI'ı anında güncelle (Optimistic UI)
    setSessionStudents(prevStudents => 
      prevStudents.map(student => 
        student.studentId === studentId 
          ? { ...student, status: newStatusString } 
          : student
      )
    );

    try {
      await axiosInstance.post('/Attendance/update-status', {
          sessionId: expandedReportId,
          studentId: studentId,
          status: newStatusInt, 
          description: "Manuel Güncelleme"
      });
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      alert("Durum güncellenemedi!");
      toggleExpand(expandedReportId); // Hata olursa listeyi yenile
    }
  };

  // ==========================================================
  // FORMATLAMA FONKSİYONLARI
  // ==========================================================
  const formatDate = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatTime = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const getDayName = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString('tr-TR', { weekday: 'short' });
  };

  const getAvatarColor = (name) => {
    const colors = ['avatar-blue', 'avatar-green', 'avatar-orange', 'avatar-purple'];
    const index = (name?.length || 0) % colors.length;
    return colors[index];
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // ==========================================================
  // EKRAN RENDER
  // ==========================================================
  return (
    <DashboardLayout role="teacher">
      <header className="dashboard-header">
        <h1>Raporlar</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')}/>
        </div>
      </header>

      <div className="reports-container">
        <h3 className="page-label">Yoklama Geçmişi</h3>

        {loading ? (
          <div style={{textAlign: 'center', padding: '50px', color: '#666'}}>
            <FaSpinner className="fa-spin" size={30} /> 
            <p>Veriler yükleniyor...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            Henüz hiç yoklama kaydı bulunmamaktadır.
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.sessionId} className={`report-card-wrapper ${!report.isActive ? 'closed-session' : 'active-session-glow'}`}>
              
              <div className="report-summary">
                
                <div className="tags-row">
                  {report.isActive ? 
                    <span className="tag tag-red-pulse"><FaBroadcastTower /> CANLI</span> :
                    <span className="tag tag-gray"><FaHistory /> GEÇMİŞ</span>
                  }
                  <span className="tag tag-blue"><FaCalendarAlt /> {formatDate(report.startTime)}</span>
                  <span className="tag tag-green"><FaClock /> {formatTime(report.startTime)}</span>
                  <span className="tag tag-orange"><FaCalendarDay /> {getDayName(report.startTime)}</span>
                  
                  <span className="tag method-tag">
                    {report.methodName === 'QrCode' ? 'QR Kod' : report.methodName === 'Location' ? 'Konum' : 'Yüz Tanıma'}
                  </span>
                </div>

                <h3 className="report-course-title">
                  {report.courseNames || "Ders Adı Yok"}
                </h3>
                
                {!report.isActive && (
                    <div className="mini-stats">
                        <span style={{fontSize:'12px', color:'#666'}}>Katılım: <b>{report.attendedCount}/{report.totalStudents}</b></span>
                    </div>
                )}

                <div className="progress-action-row">
                  <div style={{flex: 1}}></div> 

                  <div className="action-buttons">
                    {report.isActive ? (
                      <button className="btn-stop" onClick={() => handleStopSession(report.sessionId)}>
                        <FaStopCircle /> Durdur
                      </button>
                    ) : (
                      <button className="btn-closed" disabled>Kapandı</button>
                    )}

                    <button 
                      className={`btn-list ${expandedReportId === report.sessionId ? 'active' : ''}`}
                      onClick={() => toggleExpand(report.sessionId)}
                    >
                      <FaList /> {expandedReportId === report.sessionId ? 'Gizle' : 'Liste'}
                    </button>

                    {/* 🔥 YENİ EKLENEN SİL BUTONU (EN SAĞDA) 🔥 */}
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDeleteSession(report.sessionId)}
                      title="Yoklamayı Sil"
                    >
                      <FaTrash /> Sil
                    </button>
                  </div>
                </div>
              </div>

              {/* LİSTE AÇILINCA GÖRÜNEN ÖĞRENCİ DETAY PANELI */}
              {expandedReportId === report.sessionId && (
                <div className="report-details-panel">
                  
                  <div className="info-alert">
                    <FaInfoCircle className="info-alert-icon" />
                    <span><b>P:</b> Katıldı (Present) | <b>A:</b> Katılmadı (Absent) | <b>E:</b> Mazeretli (Excused)</span>
                  </div>

                  {loadingStudents ? (
                    <div style={{padding: '30px', textAlign:'center', color: '#666'}}>
                       <FaSpinner className="fa-spin" /> Liste yükleniyor...
                    </div>
                  ) : (
                    <div className="student-rows-container">
                      {sessionStudents.length === 0 ? (
                         <p style={{padding:'15px', textAlign:'center', color:'#999'}}>Bu derse kayıtlı öğrenci bulunamadı.</p>
                      ) : (
                        sessionStudents.map((student) => (
                          <div key={student.studentId} className="student-row-item">
                            
                            <div className="student-left">
                              <div className={`student-avatar-box ${getAvatarColor(student.studentName)}`}>
                                {getInitials(student.studentName)}
                              </div>
                              <div className="student-text-info">
                                <span className="s-name">{student.studentName}</span>
                                <span className="s-no">{student.schoolNumber}</span>
                              </div>
                            </div>

                            <div className="attendance-actions">
                              <div 
                                className={`circle-indicator ${student.status === 'Present' ? 'circle-green' : 'circle-inactive'}`}
                                onClick={() => handleStatusUpdate(student.studentId, 'Present', 1)}
                                title="Katıldı Yap"
                              >
                                P
                              </div>

                              <div 
                                className={`circle-indicator ${student.status === 'Absent' || student.status === 'NotMarked' ? 'circle-red' : 'circle-inactive'}`}
                                onClick={() => handleStatusUpdate(student.studentId, 'Absent', 2)}
                                title="Yok Yaz"
                              >
                                A
                              </div>

                              <div 
                                className={`circle-indicator ${student.status === 'Excused' ? 'circle-yellow' : 'circle-inactive'}`}
                                onClick={() => handleStatusUpdate(student.studentId, 'Excused', 3)}
                                title="Mazeretli Yap"
                              >
                                E
                              </div>
                            </div>

                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherReports;