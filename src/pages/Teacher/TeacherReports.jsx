import React, { useState, useEffect } from 'react';
import { FaSignOutAlt, FaList, FaStopCircle, FaInfoCircle, FaCalendarAlt, FaClock, FaCalendarDay, FaSpinner, FaHistory, FaBroadcastTower } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './TeacherReports.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
const TeacherReports = () => {
  const navigate = useNavigate();
  
  // --- STATE TANIMLARI ---
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Detay Panel Kontrolü
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [sessionStudents, setSessionStudents] = useState([]); 
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [hubConnection, setHubConnection] = useState(null);

  // 1. VERİLERİ ÇEK VE BİRLEŞTİR (Aktif + Geçmiş)
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      // İki isteği aynı anda atıyoruz (Performans için)
      const [activeRes, historyRes] = await Promise.all([
        axios.get('https://localhost:7022/api/Attendance/my-active-sessions', config),
        axios.get('https://localhost:7022/api/Attendance/instructor/history/sessions', config)
      ]);

      // --- VERİ DÜZENLEME (NORMALİZASYON) ---
      
      // 1. Aktif Dersleri Düzenle
      const activeData = activeRes.data.map(item => ({
        sessionId: item.sessionId,
        sessionCode: item.sessionCode,
        startTime: item.startTime,
        methodName: item.methodName,
        courseNames: Array.isArray(item.courseNames) ? item.courseNames.join(', ') : item.courseNames,
        isActive: true, // Frontend için bayrak: Bu ders CANLI
        attendedCount: 0, 
        totalStudents: 0
      }));

      // 2. Geçmiş Dersleri Düzenle
      const historyData = historyRes.data.map(item => ({
        sessionId: item.sessionId,
        sessionCode: "KAPALI",
        startTime: item.startTime,
        methodName: item.method, 
        courseNames: item.courseNames,
        isActive: false, // Frontend için bayrak: Bu ders GEÇMİŞ
        attendedCount: item.attendedCount,
        totalStudents: item.totalStudents
      }));

      // 3. Birleştir ve Tarihe Göre Sırala (En Yeni En Üstte)
      const combined = [...activeData, ...historyData].sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
      );

      setReports(combined);

    } catch (error) {
      console.error("Veriler çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 2. OTURUMU DURDURMA İŞLEMİ
  const handleStopSession = async (sessionId) => {
    const confirm = window.confirm("Bu yoklamayı kapatmak istediğinize emin misiniz? Öğrenciler artık giriş yapamayacak.");
    if (!confirm) return;

    try {
      const token = localStorage.getItem('jwtToken');
      // Backend: AttendanceController > EndSession
      await axios.post(`https://localhost:7022/api/Attendance/end/${sessionId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Başarılıysa sayfayı yenilemeden state'i güncelle
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
// =========================================================
  // 🚀 SIGNALR 1. AŞAMA: ANA BAĞLANTIYI KUR
  // =========================================================
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7022/attendanceHub", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log("[SignalR] Hoca bağlantısı kuruldu!");
        setHubConnection(connection);

        // Başka bir yerden ders kapatılırsa listeyi güncelle
        connection.on("SessionEndedGlobal", (sessionId) => {
          setReports(prev => prev.map(r => r.sessionId === sessionId ? { ...r, isActive: false } : r));
        });
      })
      .catch(err => console.error("[SignalR] Hoca Bağlantı Hatası:", err));

    return () => connection.stop();
  }, []);

  // =========================================================
  // 🚀 SIGNALR 2. AŞAMA: ODAYA GİR VE CANLI YOKLAMAYI İZLE
  // =========================================================
  useEffect(() => {
    // Eğer SignalR bağlıysa VE hoca bir dersin detayını açtıysa (Liste butonuna bastıysa)
    if (hubConnection && expandedReportId) {
      
      // 1. Odaya Katıl
      hubConnection.invoke("JoinSessionGroup", expandedReportId.toString())
        .catch(err => console.error("Odaya girilemedi:", err));

      console.log(`[SignalR] ${expandedReportId} numaralı dersin odasına girildi. Canlı yoklama izleniyor...`);

      // 2. Öğrenci katıldığında tetiklenecek fonksiyon
      const handleStudentAttended = (data) => {
        console.log(`[SignalR] Öğrenci Katıldı! ID: ${data.studentId}, Durum: ${data.status}`);
        
        // Listede o öğrenciyi bul ve rengini anında değiştir!
        setSessionStudents(prevStudents => 
          prevStudents.map(student => 
            student.studentId === data.studentId 
              ? { ...student, status: data.status } 
              : student
          )
        );
      };

      // Dinleyiciyi başlat
      hubConnection.on("StudentAttended", handleStudentAttended);

      // 3. Cleanup: Hoca listeyi kapattığında odadan çık ve dinlemeyi bırak
      return () => {
        hubConnection.off("StudentAttended", handleStudentAttended);
        hubConnection.invoke("LeaveSessionGroup", expandedReportId.toString())
          .catch(err => console.error("Odadan çıkılamadı:", err));
        console.log(`[SignalR] ${expandedReportId} numaralı odadan çıkıldı.`);
      };
    }
  }, [hubConnection, expandedReportId]);
  // 3. LİSTEYİ AÇ/KAPAT VE ÖĞRENCİLERİ ÇEK
  const toggleExpand = async (sessionId) => {
    if (expandedReportId === sessionId) {
      setExpandedReportId(null); 
      setSessionStudents([]);
    } else {
      setExpandedReportId(sessionId); 
      setLoadingStudents(true);
      try {
        const token = localStorage.getItem('jwtToken');
        // Backend: AttendanceController > GetFullClassList
        const response = await axios.get(`https://localhost:7022/api/Attendance/full-class-list/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSessionStudents(response.data);
      } catch (error) {
        console.error("Öğrenci listesi alınamadı:", error);
        alert("Liste yüklenemedi. Lütfen internet bağlantınızı kontrol edin.");
      } finally {
        setLoadingStudents(false);
      }
    }
  };

  // 4. DURUM GÜNCELLEME (DAİRELERE TIKLAYINCA)
  const handleStatusUpdate = async (studentId, newStatusString, newStatusInt) => {
    // Eğer durum zaten aynıysa işlem yapma
    const currentStudent = sessionStudents.find(s => s.studentId === studentId);
    if (currentStudent && currentStudent.status === newStatusString) return;

    // 1. Optimistic Update: Kullanıcı beklememesi için ekranda hemen rengi değiştir
    setSessionStudents(prevStudents => 
      prevStudents.map(student => 
        student.studentId === studentId 
          ? { ...student, status: newStatusString } 
          : student
      )
    );

    try {
      const token = localStorage.getItem('jwtToken');
      
      // 2. Backend'e gönder
      await axios.post('https://localhost:7022/api/Attendance/update-status', 
        {
          sessionId: expandedReportId,
          studentId: studentId,
          status: newStatusInt, // 1=Present, 2=Absent, 3=Excused
          description: "Manuel Güncelleme"
        }, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

    } catch (error) {
      console.error("Güncelleme hatası:", error);
      alert("Durum güncellenemedi!");
      toggleExpand(expandedReportId); // Hata olursa listeyi eski haline getir
    }
  };

  // --- YARDIMCI FORMAT FONKSİYONLARI ---
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
              
              {/* --- KARTIN ÜST KISMI (ÖZET) --- */}
              <div className="report-summary">
                
                {/* Sol: Etiketler */}
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

                {/* Orta: Ders Adı */}
                <h3 className="report-course-title">
                  {report.courseNames || "Ders Adı Yok"}
                </h3>
                
                {/* İstatistik */}
                {!report.isActive && (
                    <div className="mini-stats">
                        <span style={{fontSize:'12px', color:'#666'}}>Katılım: <b>{report.attendedCount}/{report.totalStudents}</b></span>
                    </div>
                )}

                {/* Sağ: Butonlar */}
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
                  </div>
                </div>
              </div>

              {/* --- KARTIN ALT KISMI (DETAY) --- */}
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
                            
                            {/* Sol: Avatar ve İsim */}
                            <div className="student-left">
                              <div className={`student-avatar-box ${getAvatarColor(student.studentName)}`}>
                                {getInitials(student.studentName)}
                              </div>
                              <div className="student-text-info">
                                <span className="s-name">{student.studentName}</span>
                                <span className="s-no">{student.schoolNumber}</span>
                              </div>
                            </div>

                            {/* Sağ: 3 YUVARLAK ETKİLEŞİMLİ BUTON */}
                            <div className="attendance-actions">
                              
                              {/* P (Katıldı) - 1 */}
                              <div 
                                className={`circle-indicator ${student.status === 'Present' ? 'circle-green' : 'circle-inactive'}`}
                                onClick={() => handleStatusUpdate(student.studentId, 'Present', 1)}
                                title="Katıldı Yap"
                              >
                                P
                              </div>

                              {/* A (Yok) - 2 */}
                              <div 
                                className={`circle-indicator ${student.status === 'Absent' || student.status === 'NotMarked' ? 'circle-red' : 'circle-inactive'}`}
                                onClick={() => handleStatusUpdate(student.studentId, 'Absent', 2)}
                                title="Yok Yaz"
                              >
                                A
                              </div>

                              {/* E (İzinli) - 3 */}
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