import React, { useState, useEffect } from 'react';
import { FaSignOutAlt, FaQrcode, FaSmile, FaMapMarkerAlt, FaChevronRight, FaSpinner, FaCheckCircle, FaCalendarAlt, FaClock } from 'react-icons/fa';
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
  const [attendanceType, setAttendanceType] = useState('');
  
  // Form Verileri
  const [courses, setCourses] = useState([]); // Ekranda gösterilecek gruplanmış dersler
  const [selectedCourseIds, setSelectedCourseIds] = useState(''); // Artık tek ID değil, "2,3" gibi virgüllü tutacağız
  
  const [selectedDateOnly, setSelectedDateOnly] = useState(new Date().toISOString().slice(0, 10));
  const [selectedPeriodTime, setSelectedPeriodTime] = useState("08:30");

  const classPeriods = [
    { id: 1, label: "08:30 - 09:20", value: "08:30" },
    { id: 2, label: "09:30 - 10:20", value: "09:30" },
    { id: 3, label: "10:30 - 11:20", value: "10:30" },
    { id: 4, label: "11:30 - 12:20", value: "11:30" },
    { id: 5, label: "12:30 - 13:20", value: "12:30" },
    { id: 6, label: "13:30 - 14:20", value: "13:30" },
    { id: 7, label: "14:30 - 15:20", value: "14:30" },
    { id: 8, label: "15:30 - 16:20", value: "15:30" },
    { id: 9, label: "16:30 - 17:20", value: "16:30" }
  ];
  
  const [createdSession, setCreatedSession] = useState(null);
  const [qrContent, setQrContent] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getDotNetTicks = () => {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 3600000);
    return (expiryDate.getTime() * 10000) + 621355968000000000;
  };

  useEffect(() => {
    let intervalId;
    if (createdSession && createdSession.sessionCode && attendanceType === 'QRCode') {
      const updateQR = () => {
        const ticks = getDotNetTicks();
        const newContent = `${createdSession.sessionCode}||${ticks}`;
        setQrContent(newContent);
      };
      updateQR(); 
      intervalId = setInterval(updateQR, 12000); 
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [createdSession, attendanceType]);

  // --- DERSLERİ ÇEKME VE GRUPLAMA (ÇAPRAZ DERS MANTIĞI) ---
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const token = localStorage.getItem('jwtToken');
        if (!token) return;

        const response = await axios.get('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/my-courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const rawCourses = response.data;
        
        // Ders kodundaki sayılara göre (Örn: 419) gruplama yapıyoruz
        const grouped = {};
        rawCourses.forEach(course => {
          const match = course.courseCode.match(/\d+/);
          const num = match ? match[0] : course.courseCode;

          if (!grouped[num]) {
            grouped[num] = {
              ids: [course.id],
              codes: [course.courseCode],
              names: [course.courseName]
            };
          } else {
            grouped[num].ids.push(course.id);
            grouped[num].codes.push(course.courseCode);
            grouped[num].names.push(course.courseName);
          }
        });

        // Gruplanmış objeyi select-option için diziye çeviriyoruz
        const displayCourses = Object.values(grouped).map(g => {
          if (g.ids.length === 1) {
            // Tekli ders (Örn: Sadece CMPE428)
            return {
              value: g.ids.join(','), // "1"
              label: `${g.codes[0]} - ${g.names[0]}`
            };
          } else {
            // Çapraz ders (Örn: CMPE419 ve BLGM419)
            return {
              value: g.ids.join(','), // "2,3"
              label: `${g.codes.join(' / ')} - ${g.names[0]}` // "CMPE419 / BLGM419 - Mobile App Development"
            };
          }
        });

        setCourses(displayCourses);
        
        if (displayCourses.length > 0) {
          setSelectedCourseIds(displayCourses[0].value); // İlk grubun ID(ler)ini seçili yap
        }
      } catch (err) {
        console.error("Dersler yüklenemedi", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  const handleOpenModal = (title, type) => {
    setModalTitle(title);
    setAttendanceType(type);
    setCreatedSession(null); 
    setQrContent(""); 
    setSelectedDateOnly(new Date().toISOString().slice(0, 10));
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSubmitting(false);
    setCreatedSession(null);
  };

  // --- YOKLAMA BAŞLATMA ---
  const handleStartAttendance = async () => {
    if (!selectedCourseIds) {
      alert("Lütfen bir ders seçiniz!");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('jwtToken');

      let methodEnum = 1; 
      let requireFace = false;

      if (attendanceType === 'QRCode') { methodEnum = 1; } 
      else if (attendanceType === 'Location') { methodEnum = 2; } 
      else if (attendanceType === 'FaceRecognition') { methodEnum = 3; requireFace = true; }

      const finalDateTime = `${selectedDateOnly}T${selectedPeriodTime}:00`;

      // VİRGÜLLÜ METNİ ([2,3] GİBİ) SAYISAL DİZİYE ÇEVİRİYORUZ
      const idArray = selectedCourseIds.split(',').map(id => parseInt(id));

      const payload = {
        courseIds: idArray, // BURASI ARTIK [2, 3] GİBİ BİR DİZİ GİDİYOR
        method: methodEnum,                      
        requireFaceVerification: requireFace,    
        requireDeviceVerification: true,         
        radiusMeters: 50,                        
        startTime: finalDateTime 
      };

      console.log("Giden Veri:", payload);

      const response = await axios.post('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/attendance/start', payload, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });

      console.log("Başarılı:", response.data);
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

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
           <div className="modal-box" onClick={(e) => e.stopPropagation()}>
             
             {createdSession ? (
               <div style={{ textAlign: 'center', padding: '10px' }}>
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
               <>
                 <h2 className="modal-title">{modalTitle}</h2>
                 
                 <div className="modal-body">
                   
                   {/* 1. Ders Seçimi */}
                   <div className="form-group">
                     <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color:'#555'}}>Ders Seçimi</label>
                     {loadingCourses ? (
                       <p>Yükleniyor...</p>
                     ) : (
                       <select 
                          className="course-select-input" 
                          value={selectedCourseIds} 
                          onChange={(e) => setSelectedCourseIds(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '15px' }}
                       >
                         {courses.length === 0 && <option value="">Ders bulunamadı</option>}
                         {courses.map(c => (
                           <option key={c.value} value={c.value}>
                             {c.label}
                           </option>
                         ))}
                       </select>
                     )}
                   </div>

                   {/* 2. Tarih Seçimi */}
                   <div className="form-group">
                      <label style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px', fontWeight:'bold', color:'#555'}}>
                         <FaCalendarAlt /> Tarih
                      </label>
                      <input 
                        type="date"
                        value={selectedDateOnly}
                        onChange={(e) => setSelectedDateOnly(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '15px' }}
                      />
                   </div>

                   {/* 3. Ders Saati Seçimi */}
                   <div className="form-group">
                      <label style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px', fontWeight:'bold', color:'#555'}}>
                         <FaClock /> Ders Saati
                      </label>
                      <select
                        value={selectedPeriodTime}
                        onChange={(e) => setSelectedPeriodTime(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '20px' }}
                      >
                         {classPeriods.map(period => (
                           <option key={period.id} value={period.value}>
                             {period.label}
                           </option>
                         ))}
                      </select>
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