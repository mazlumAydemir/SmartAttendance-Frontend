import React, { useState, useEffect } from 'react';
import { FaSignOutAlt, FaQrcode, FaSmile, FaMapMarkerAlt, FaChevronRight, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCode from "react-qr-code";
import DashboardLayout from '../../layouts/DashboardLayout';
import './TeacherAttendance.css';

const TeacherAttendance = () => {
  const navigate = useNavigate();
  
  // --- STATE TANIMLARI ---
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [attendanceType, setAttendanceType] = useState(''); // 'QRCode', 'FaceRecognition', 'Location'
  
  // Form Verileri
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 16)); 
  
  // API Cevabı ve QR Verisi
  const [createdSession, setCreatedSession] = useState(null);
  const [qrContent, setQrContent] = useState("");

  // Yüklenme Durumları
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- YARDIMCI: C# TICKS ---
  // JavaScript zamanını C# Ticks formatına çevirir
  const getDotNetTicks = () => {
    const now = new Date();
    // 15 Saniyelik geçerlilik süresi ekle
    const expiryDate = new Date(now.getTime() + 15000); 
    const ticks = (expiryDate.getTime() * 10000) + 621355968000000000;
    return ticks;
  };

  // --- QR GÜNCELLEYİCİ ---
  // Sadece oturum varsa VE yöntem QR ise çalışır
  useEffect(() => {
    let intervalId;

    if (createdSession && createdSession.sessionCode && attendanceType === 'QRCode') {
      const updateQR = () => {
        const ticks = getDotNetTicks();
        // Backend formatı: SessionCode || ExpirationTicks
        const newContent = `${createdSession.sessionCode}||${ticks}`;
        setQrContent(newContent);
      };

      updateQR(); // İlk hemen çalıştır
      intervalId = setInterval(updateQR, 12000); // 12 saniyede bir yenile
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [createdSession, attendanceType]);


  // 1. Sayfa Açılınca Dersleri Çek
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const token = localStorage.getItem('jwtToken');
        if (!token) return;

        const response = await axios.get('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/my-courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCourses(response.data);
        
        // İlk dersi varsayılan seç
        if (response.data.length > 0) {
          setSelectedCourseId(response.data[0].id);
        }
      } catch (err) {
        console.error("Dersler yüklenemedi", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Modal Açma
  const handleOpenModal = (title, type) => {
    setModalTitle(title);
    setAttendanceType(type);
    setCreatedSession(null); 
    setQrContent(""); 
    setSelectedDate(new Date().toISOString().slice(0, 16));
    setShowModal(true);
  };

  // Modal Kapatma
  const handleCloseModal = () => {
    setShowModal(false);
    setSubmitting(false);
    setCreatedSession(null);
  };

  // 2. YOKLAMA BAŞLATMA (POST İsteği)
  const handleStartAttendance = async () => {
    if (!selectedCourseId) {
      alert("Lütfen bir ders seçiniz!");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('jwtToken');

      // --- DÜZELTME BURADA YAPILDI (BACKEND ENUM UYUMU) ---
      // Backend: QrCode=1, Location=2, FaceScan=3
      let methodEnum = 1; // Varsayılan 1 (QR)
      let requireFace = false;

      if (attendanceType === 'QRCode') {
        methodEnum = 1; // Backend: QrCode
      } else if (attendanceType === 'Location') {
        methodEnum = 2; // Backend: Location
      } else if (attendanceType === 'FaceRecognition') {
        methodEnum = 3; // Backend: FaceScan
        requireFace = true; 
      }

      // Backend DTO Formatı
      const payload = {
        courseIds: [parseInt(selectedCourseId)], 
        method: methodEnum,                      
        requireFaceVerification: requireFace,    
        requireDeviceVerification: true,         
        radiusMeters: 50,                        
        startTime: selectedDate                  
      };

      console.log("Giden Veri:", payload);

      const response = await axios.post('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/attendance/start', payload, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });

      console.log("Başarılı:", response.data);
      
      // Başarılı olunca oturum bilgisini kaydet (Modal içeriği değişecek)
      setCreatedSession(response.data);

    } catch (err) {
      console.error("Hata:", err);
      let errorMsg = "Yoklama başlatılamadı.";
      if (err.response && err.response.data) {
          errorMsg = err.response.data.message || JSON.stringify(err.response.data);
      }
      alert("HATA: " + errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="teacher">
      <header className="dashboard-header">
        <h1>Yoklama Başlat</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
        </div>
      </header>

      {/* Kartlar */}
      <div className="attendance-cards-container">
        <div className="attendance-card card-blue" onClick={() => handleOpenModal('QR Kod ile Yoklama', 'QRCode')}>
          <div className="card-icon-box"><FaQrcode /></div>
          <div className="card-content"><h3>QR Kod</h3><p>Hızlı yoklama</p></div>
          <div className="card-arrow"><FaChevronRight /></div>
        </div>

        <div className="attendance-card card-green" onClick={() => handleOpenModal('Yüz Tanıma ile Yoklama', 'FaceRecognition')}>
          <div className="card-icon-box"><FaSmile /></div>
          <div className="card-content"><h3>Yüz Tanıma</h3><p>Biyometrik yoklama</p></div>
          <div className="card-arrow"><FaChevronRight /></div>
        </div>

        <div className="attendance-card card-orange" onClick={() => handleOpenModal('Konum Bazlı Yoklama', 'Location')}>
          <div className="card-icon-box"><FaMapMarkerAlt /></div>
          <div className="card-content"><h3>Konum</h3><p>GPS ile yoklama</p></div>
          <div className="card-arrow"><FaChevronRight /></div>
        </div>
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
           {/* stopPropagation: Kutu içine tıklayınca kapanmasın */}
           <div className="modal-box" onClick={(e) => e.stopPropagation()}>
             
             {/* --- SENARYO 1: OTURUM OLUŞTUYSA --- */}
             {createdSession ? (
               <div style={{ textAlign: 'center', padding: '10px' }}>
                 
                 {/* DURUM A: QR KOD İSE */}
                 {attendanceType === 'QRCode' ? (
                   <>
                     <h2 style={{ color: '#2e7d32', marginBottom: '10px' }}>Yoklama Başlatıldı!</h2>
                     <p style={{ fontSize:'12px', color: '#e65100', fontWeight:'bold' }}>
                        QR Kod her 12 saniyede bir yenileniyor...
                     </p>
                     
                     <div style={{ background: 'white', padding: '15px', display: 'inline-block', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }}>
                        {qrContent ? <QRCode value={qrContent} size={220} /> : <p>QR Oluşturuluyor...</p>}
                     </div>

                     <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '6px', margin: '0 auto 20px auto', maxWidth: '300px' }}>
                        <span style={{ display: 'block', fontSize: '12px', color: '#888' }}>Oturum Kodu</span>
                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', letterSpacing: '2px' }}>
                          {createdSession.sessionCode}
                        </span>
                     </div>
                   </>
                 ) : (
                   /* DURUM B: DİĞER YÖNTEMLER (YÜZ VEYA KONUM) */
                   <div style={{ padding: '30px 10px' }}>
                     <FaCheckCircle style={{ fontSize: '60px', color: '#4caf50', marginBottom: '20px' }} />
                     
                     <h2 style={{ color: '#2e7d32', marginBottom: '10px' }}>
                        {attendanceType === 'FaceRecognition' ? 'Yüz Tanıma' : 'Konum'} Yoklaması Aktif!
                     </h2>
                     
                     <p style={{ color: '#555', marginBottom: '20px', fontSize: '16px' }}>
                       Yoklama sistemi başarıyla devreye alındı. Öğrenciler giriş yapabilirler.
                     </p>

                     <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', display: 'inline-block' }}>
                        <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>Oturum Kodu: </span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{createdSession.sessionCode}</span>
                     </div>
                   </div>
                 )}

                 <button className="btn-start-blue" onClick={handleCloseModal} style={{ marginTop: '20px' }}>
                    Tamam, Kapat
                 </button>
               </div>

             ) : (
               
               /* --- SENARYO 2: BAŞLANGIÇ FORMU --- */
               <>
                 <h2 className="modal-title">{modalTitle}</h2>
                 
                 <div className="modal-body">
                   {/* Ders Seçimi */}
                   <div className="form-group">
                     <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color:'#555'}}>Ders Seçimi</label>
                     {loadingCourses ? (
                       <p>Yükleniyor...</p>
                     ) : (
                       <select 
                          className="course-select-input" 
                          value={selectedCourseId} 
                          onChange={(e) => setSelectedCourseId(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '15px' }}
                       >
                         {courses.length === 0 && <option value="">Ders bulunamadı</option>}
                         {courses.map(c => (
                           <option key={c.id} value={c.id}>
                             {c.courseCode} - {c.courseName}
                           </option>
                         ))}
                       </select>
                     )}
                   </div>

                   {/* Tarih Seçimi */}
                   <div className="form-group">
                      <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color:'#555'}}>Başlangıç Tarihi ve Saati</label>
                      <input 
                        type="datetime-local"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '20px' }}
                      />
                   </div>
                 </div>

                 <div className="modal-footer">
                   <button className="btn-cancel" onClick={handleCloseModal} style={{marginRight: '10px', padding: '10px 20px', border:'none', background:'#f44336', color:'white', borderRadius:'6px', cursor:'pointer'}}>
                     İptal
                   </button>
                   
                   <button 
                    className="btn-start-blue" 
                    onClick={handleStartAttendance}
                    disabled={submitting || courses.length === 0}
                    style={{ opacity: submitting ? 0.7 : 1 }}
                   >
                     {submitting ? <><FaSpinner className="fa-spin" /> Başlatılıyor...</> : 'Yoklamayı Başlat'}
                   </button>
                 </div>
               </>
             )}

           </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherAttendance;