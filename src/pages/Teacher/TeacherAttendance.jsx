import React, { useState, useEffect, useRef } from 'react';
import { FaSignOutAlt, FaQrcode, FaSmile, FaMapMarkerAlt, FaChevronRight, FaSpinner, FaCheckCircle, FaCalendarAlt, FaClock, FaSyncAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";
import Webcam from "react-webcam";
import axiosInstance from '../../api/axiosInstance';
import DashboardLayout from '../../layouts/DashboardLayout';
import './TeacherAttendance.css'; 

const TeacherAttendance = () => {
  const navigate = useNavigate();
  
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [attendanceType, setAttendanceType] = useState('');
  
  const [courses, setCourses] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState(''); 
  const [selectedDateOnly, setSelectedDateOnly] = useState(new Date().toISOString().slice(0, 10));
  const [selectedPeriodTime, setSelectedPeriodTime] = useState("08:30");

  const classPeriods = [
    { id: 1, label: "08:30 - 09:20", value: "08:30" }, { id: 2, label: "09:30 - 10:20", value: "09:30" },
    { id: 3, label: "10:30 - 11:20", value: "10:30" }, { id: 4, label: "11:30 - 12:20", value: "11:30" },
    { id: 5, label: "12:30 - 13:20", value: "12:30" }, { id: 6, label: "13:30 - 14:20", value: "13:30" },
    { id: 7, label: "14:30 - 15:20", value: "14:30" }, { id: 8, label: "15:30 - 16:20", value: "15:30" },
    { id: 9, label: "16:30 - 17:20", value: "16:30" }
  ];
  
  const [createdSession, setCreatedSession] = useState(null);
  const [qrContent, setQrContent] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const webcamRef = useRef(null);
  const [recognizedNames, setRecognizedNames] = useState([]);
  const [facingMode, setFacingMode] = useState("environment");
  
  const [isContinuousScanning, setIsContinuousScanning] = useState(false);
  const scanningRef = useRef(false);
  const timeoutRef = useRef(null);

  const [isModelsLoaded, setIsModelsLoaded] = useState(true); 

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
        setQrContent(`${createdSession.sessionCode}||${ticks}`);
      };
      updateQR(); 
      intervalId = setInterval(updateQR, 12000); 
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [createdSession, attendanceType]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await axiosInstance.get('/Attendance/my-courses');
        const rawCourses = response.data;
        const grouped = {};
        rawCourses.forEach(course => {
          const match = course.courseCode.match(/\d+/);
          const num = match ? match[0] : course.courseCode;
          if (!grouped[num]) {
            grouped[num] = { ids: [course.id], codes: [course.courseCode], names: [course.courseName] };
          } else {
            grouped[num].ids.push(course.id);
            grouped[num].codes.push(course.courseCode);
            grouped[num].names.push(course.courseName);
          }
        });
        const displayCourses = Object.values(grouped).map(g => {
          if (g.ids.length === 1) return { value: g.ids.join(','), label: `${g.codes[0]} - ${g.names[0]}` };
          else return { value: g.ids.join(','), label: `${g.codes.join(' / ')} - ${g.names[0]}` };
        });
        setCourses(displayCourses);
        if (displayCourses.length > 0) setSelectedCourseIds(displayCourses[0].value); 
      } catch (err) { console.error("Dersler yüklenemedi", err); } 
      finally { setLoadingCourses(false); }
    };
    fetchCourses();
  }, []);

  const handleOpenModal = (title, type) => {
    setModalTitle(title);
    setAttendanceType(type);
    setCreatedSession(null); 
    setQrContent(""); 
    setRecognizedNames([]); 
    setFacingMode("environment"); 
    setIsContinuousScanning(false);
    scanningRef.current = false;
    clearTimeout(timeoutRef.current);
    setSelectedDateOnly(new Date().toISOString().slice(0, 10));
    setShowModal(true);
  };

  const handleCloseModal = () => {
    scanningRef.current = false;
    setIsContinuousScanning(false);
    clearTimeout(timeoutRef.current);
    setShowModal(false);
    setSubmitting(false);
    setCreatedSession(null);
    setRecognizedNames([]); 
  };

  const toggleCamera = () => {
    setFacingMode(prevMode => (prevMode === "environment" ? "user" : "environment"));
  };

  const handleStartAttendance = async () => {
    if (!selectedCourseIds) { alert("Lütfen bir ders seçiniz!"); return; }
    try {
      setSubmitting(true);
      let methodEnum = 1; let requireFace = false;
      if (attendanceType === 'QRCode') { methodEnum = 1; } 
      else if (attendanceType === 'Location') { methodEnum = 2; } 
      else if (attendanceType === 'FaceRecognition') { methodEnum = 3; requireFace = true; } 
      const payload = {
        courseIds: selectedCourseIds.split(',').map(id => parseInt(id)), 
        method: methodEnum, requireFaceVerification: requireFace,    
        requireDeviceVerification: true, radiusMeters: 50,                        
        startTime: `${selectedDateOnly}T${selectedPeriodTime}:00` 
      };
      
      const response = await axiosInstance.post('/attendance/start', payload);
      setCreatedSession(response.data);
    } catch (err) {
      alert("HATA: " + (err.response?.data?.message || "Yoklama başlatılamadı."));
    } finally { setSubmitting(false); }
  };

  const getFullFrameBlob = () => {
    return new Promise((resolve) => {
      const video = webcamRef.current.video;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg', 0.8);
    });
  };

  // 🔥 DEĞİŞTİRİLEN VE HATALARDAN ARINDIRILAN KISIM
  const processNextFrame = async () => {
      if (!scanningRef.current || !webcamRef.current || !createdSession) return;
      
      try {
          const faceBlob = await getFullFrameBlob();
          const faceFile = new File([faceBlob], `frame_${Date.now()}.jpg`, { type: 'image/jpeg' });

          const formData = new FormData();
          // Backend id veya sessionId dönebilir, ikisini de garantiye alıyoruz
          const activeSessionId = createdSession.sessionId || createdSession.id;
          formData.append('sessionId', activeSessionId); 
          formData.append('frame', faceFile);

          axiosInstance.post('/Attendance/instructor/scan-crowd', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          }).then(response => {
              // Backend direkt liste dönebilir veya obje içinde dönebilir
              const newlyRecognized = response.data.recognizedNames || response.data;
              
              // Tarayıcı konsolunda gelen veriyi görelim (Hata ayıklamak için)
              console.log("📸 [AI TARAMA SONUCU]:", newlyRecognized);

              // Eğer dönen veri bir diziyse ve içi boş değilse listeye ekle
              if (newlyRecognized && Array.isArray(newlyRecognized) && newlyRecognized.length > 0) {
                  setRecognizedNames(prev => [...new Set([...prev, ...newlyRecognized])]);
              }
          }).catch(e => {
              console.error("Tanıma hatası:", e);
          });

      } catch (error) {
          console.error("Tarama Hatası:", error);
      }

      if (scanningRef.current) {
          timeoutRef.current = setTimeout(processNextFrame, 2000); 
      }
  };

  const handleCameraReady = () => {
      if (!scanningRef.current && createdSession) {
          scanningRef.current = true;
          setIsContinuousScanning(true);
          clearTimeout(timeoutRef.current); 
          processNextFrame(); 
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
           <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
             
             {createdSession ? (
               <div style={{ textAlign: 'center', padding: '10px' }}>
                 
                 {attendanceType === 'QRCode' && (
                   <>
                     <h2 style={{ color: '#2e7d32', marginBottom: '10px' }}>Yoklama Başlatıldı!</h2>
                     <p style={{ fontSize:'12px', color: '#e65100', fontWeight:'bold' }}>QR Kod her 12 saniyede bir yenileniyor...</p>
                     <div style={{ background: 'white', padding: '15px', display: 'inline-block', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }}>
                        {qrContent ? <QRCode value={qrContent} size={220} /> : <p>QR Oluşturuluyor...</p>}
                     </div>
                     <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '6px', margin: '0 auto 20px auto', maxWidth: '300px' }}>
                        <span style={{ display: 'block', fontSize: '12px', color: '#888' }}>Oturum Kodu</span>
                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', letterSpacing: '2px' }}>{createdSession.sessionCode}</span>
                     </div>
                   </>
                 )}

                 {attendanceType === 'FaceRecognition' && (
                    <div style={{ padding: '0px', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h2 style={{ color: '#2e7d32', margin: 0, fontSize: '1.2rem' }}>Canlı Sınıf Taraması</h2>
                            <button 
                                onClick={toggleCamera} 
                                style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '12px' }}
                            >
                                <FaSyncAlt /> Çevir
                            </button>
                        </div>
                        
                        <p style={{ color: '#555', marginBottom: '15px', fontSize: '13px', textAlign: 'left' }}>
                           Kamerayı sınıfa doğrultun. Sistem arka planda yüzleri otomatik tarayıp kaydedecektir.
                        </p>
                        
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: isContinuousScanning ? '4px solid #10b981' : '3px solid #1f2937', marginBottom: '15px', backgroundColor: '#000', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            {isContinuousScanning && (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'rgba(16, 185, 129, 0.8)', color: 'white', padding: '4px 0', fontSize: '12px', fontWeight: 'bold', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                    <FaSpinner className="fa-spin" /> Otomatik Tarama Aktif
                                </div>
                            )}

                          <Webcam
                              audio={false}
                              ref={webcamRef}
                              screenshotFormat="image/jpeg"
                              videoConstraints={{ 
                                  facingMode: facingMode
                                  
                              }} 
                              onUserMedia={handleCameraReady} 
                              style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                          />
                        </div> 
                        <div style={{ textAlign: 'left', background: '#f3f4f6', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                ✅ Tanınan Öğrenciler 
                                <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{recognizedNames.length}</span>
                            </h4>
                            {recognizedNames.length === 0 ? (
                                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>Taranıyor, lütfen bekleyin...</p>
                            ) : (
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#047857', maxHeight: '120px', overflowY: 'auto' }}>
                                    {recognizedNames.map((name, idx) => (
                                        <li key={idx} style={{ marginBottom: '6px', fontWeight: 'bold' }}>{name}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                 )}

                 {attendanceType === 'Location' && (
                   <div style={{ padding: '30px 10px' }}>
                     <FaCheckCircle style={{ fontSize: '60px', color: '#4caf50', marginBottom: '20px' }} />
                     <h2 style={{ color: '#2e7d32', marginBottom: '10px' }}>Konum Yoklaması Aktif!</h2>
                     <p style={{ color: '#555', marginBottom: '20px', fontSize: '16px' }}>Öğrenciler giriş yapabilirler.</p>
                     <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', display: 'inline-block' }}>
                        <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>Oturum Kodu: </span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{createdSession.sessionCode}</span>
                     </div>
                   </div>
                 )}

                 <button className="btn-cancel" onClick={handleCloseModal} style={{ marginTop: '20px', padding: '12px 20px', width: '100%', border:'none', background:'#ef4444', color:'white', borderRadius:'8px', cursor:'pointer', fontWeight: 'bold' }}>
                   Kapat
                 </button>
               </div>

             ) : (
               <>
                 <h2 className="modal-title">{modalTitle}</h2>
                 <div className="modal-body">
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
                           <option key={c.value} value={c.value}>{c.label}</option>
                         ))}
                       </select>
                     )}
                   </div>

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
                           <option key={period.id} value={period.value}>{period.label}</option>
                         ))}
                      </select>
                   </div>
                 </div>

                 <div className="modal-footer">
                   <button className="btn-cancel" onClick={handleCloseModal} style={{marginRight: '10px', padding: '10px 20px', border:'none', background:'#f44336', color:'white', borderRadius:'6px', cursor:'pointer'}}>İptal</button>
                   <button 
                    className="btn-start-blue" 
                    onClick={handleStartAttendance}
                    disabled={submitting || courses.length === 0}
                    style={{ opacity: submitting ? 0.7 : 1, padding: '10px 20px', border:'none', background:'#2196f3', color:'white', borderRadius:'6px', cursor:'pointer' }}
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