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
  
  // STATE
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [attendanceType, setAttendanceType] = useState('');
  
  const [courses, setCourses] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState(''); 
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

  // FACE RECOGNITION
  const webcamRef = useRef(null);
  const [recognizedNames, setRecognizedNames] = useState([]);
  const [facingMode, setFacingMode] = useState("environment");
  const [liveNotifications, setLiveNotifications] = useState([]);
  const activeRecognizedNames = useRef([]); 

  // SCANNING CONTROL
  const [isContinuousScanning, setIsContinuousScanning] = useState(false);
  const scanningRef = useRef(false);
  const timeoutRef = useRef(null);
  const processingRef = useRef(false);
  const frameCountRef = useRef(0);

  const getDotNetTicks = () => {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 3600000);
    return (expiryDate.getTime() * 10000) + 621355968000000000;
  };

  // QR Kodu güncelle
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

  // Dersleri yükle
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

        const displayCourses = Object.values(grouped).map(g => ({
          value: g.ids.join(','), 
          label: g.ids.length === 1 ? `${g.codes[0]} - ${g.names[0]}` : `${g.codes.join(' / ')} - ${g.names[0]}`
        }));

        setCourses(displayCourses);
        if (displayCourses.length > 0) setSelectedCourseIds(displayCourses[0].value); 
      } catch (err) {
        console.error("❌ Dersler yüklenemedi:", err);
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
    setRecognizedNames([]); 
    activeRecognizedNames.current = []; 
    setLiveNotifications([]); 
    setFacingMode("environment"); 
    
    setIsContinuousScanning(false);
    scanningRef.current = false;
    processingRef.current = false;
    frameCountRef.current = 0;
    clearTimeout(timeoutRef.current);

    setSelectedDateOnly(new Date().toISOString().slice(0, 10));
    setShowModal(true);
  };

  const handleCloseModal = () => {
    scanningRef.current = false;
    processingRef.current = false;
    clearTimeout(timeoutRef.current);
    setIsContinuousScanning(false);
    setShowModal(false);
    setSubmitting(false);
    setCreatedSession(null);
    setRecognizedNames([]); 
    activeRecognizedNames.current = [];
    setLiveNotifications([]);
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
        method: methodEnum,                      
        requireFaceVerification: requireFace,    
        requireDeviceVerification: true,         
        radiusMeters: 50,                        
        startTime: `${selectedDateOnly}T${selectedPeriodTime}:00` 
      };

      const response = await axiosInstance.post('/Attendance/start', payload);
      setCreatedSession(response.data);
    } catch (err) {
      alert("HATA: " + (err.response?.data?.message || JSON.stringify(err.response?.data) || "Yoklama başlatılamadı."));
    } finally {
      setSubmitting(false);
    }
  };

// ✅ KİLİTLENMEYE KARŞI KORUMALI & GERÇEK HD TARAMA FONKSİYONU
  const processNextFrame = async () => {
    if (!scanningRef.current || !webcamRef.current || !createdSession) return;
    
    if (processingRef.current) {
        timeoutRef.current = setTimeout(processNextFrame, 1000);
        return;
    }

    try {
      processingRef.current = true;
      const video = webcamRef.current.video;
      
      // Video hazırsa ve gerçek boyutları belli olmuşsa işleme başla
      if (video && video.readyState === 4 && video.videoWidth > 0) {
        frameCountRef.current++;
        console.log(`📸 Frame ${frameCountRef.current}: ${video.videoWidth}x${video.videoHeight} HD Çözünürlükte sunucuya gönderiliyor...`);

        // 1. Görüntüyü "ekrandaki kutudan" değil, doğrudan "kameranın merceğinden" HD olarak al
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;   // Gerçek donanım genişliği (örn: 1280)
        canvas.height = video.videoHeight; // Gerçek donanım yüksekliği (örn: 720)
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 2. Base64 yerine doğrudan Blob (Dosya) oluştur (Çok daha hızlı)
        const frameBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 1.0));
        const frameFile = new File([frameBlob], `hd_frame_${Date.now()}.jpg`, { type: 'image/jpeg' });

        // 3. API'ye Yolla
      // 3. Tek bir fotoğrafla API'ye yolla (GPU yüzleri bulacak)
        const formData = new FormData();
        formData.append('sessionId', createdSession.sessionId); 
        formData.append('frame', frameFile);

        const response = await axiosInstance.post('/Attendance/instructor/scan-crowd', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // 🟢 HATA AYIKLAMA: API'den tam olarak ne geldiğini konsola yazdır
        console.log("🟢 API YANITI:", response.data);

        // 4. API'den dönen sonuçları GÜVENLİ İŞLE (Format ne olursa olsun yakala)
        let foundStudents = [];
        
        // Eğer doğrudan dizi geldiyse ( Örn: [5] veya ["Ali"] )
        if (Array.isArray(response.data)) {
            foundStudents = response.data;
        } 
        // Eğer obje içinde geldiyse ( Örn: { data: [5] } veya { students: ["Ali"] } )
        else if (response.data && typeof response.data === 'object') {
            if (Array.isArray(response.data.data)) foundStudents = response.data.data;
            else if (Array.isArray(response.data.recognizedIds)) foundStudents = response.data.recognizedIds;
            else if (Array.isArray(response.data.names)) foundStudents = response.data.names;
            // Gerekirse objenin içindeki ilk diziyi otomatik bul
            else {
               const arrayKey = Object.keys(response.data).find(key => Array.isArray(response.data[key]));
               if (arrayKey) foundStudents = response.data[arrayKey];
            }
        }

        // Bulunan öğrencileri ekrana yansıt
        if (foundStudents.length > 0) {
          // Gelen verileri string'e çevir (ID geldiyse "5" olarak işlesin)
          const freshNames = foundStudents.map(String).filter(name => !activeRecognizedNames.current.includes(name));

          if (freshNames.length > 0) {
            console.log(`🎉 YENİ KİŞİ(LER) EKRANA BASILIYOR: ${freshNames.join(", ")}`);
            
            setRecognizedNames(prev => [...new Set([...prev, ...freshNames])]);
            activeRecognizedNames.current.push(...freshNames);

            const newNotifs = freshNames.map((name, index) => ({
              id: Date.now() + index + Math.random(),
              name: name // Eğer C# sadece "5" yolluyorsa ekranda "5 Okundu" yazar.
            }));

            setLiveNotifications(prev => [...prev, ...newNotifs]);

            // Bildirimleri 2.5 saniye sonra ekrandan sil
            setTimeout(() => {
              setLiveNotifications(currentNotifs => 
                currentNotifs.filter(n => !newNotifs.some(nn => nn.id === n.id))
              );
            }, 2500);
          }
        }
      }
    } catch (error) {
      console.error("❌ Tarama Hatası:", error);
    } finally {
      processingRef.current = false; 
      if (scanningRef.current) {
        timeoutRef.current = setTimeout(processNextFrame, 3000); 
      }
    }
  };
  const handleCameraReady = () => {
    if (!scanningRef.current && createdSession) {
      console.log("📹 Kamera hazır, tarama başlıyor...");
      scanningRef.current = true;
      processingRef.current = false;
      frameCountRef.current = 0;
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
                        Kamerayı sınıfa doğrultun. Sistem yüzleri otomatik olarak bulup kaydedecektir.
                      </p>
                      
                      <div style={{ borderRadius: '12px', overflow: 'hidden', border: isContinuousScanning ? '4px solid #10b981' : '3px solid #1f2937', marginBottom: '15px', backgroundColor: '#000', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        
                        {isContinuousScanning && (
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'rgba(16, 185, 129, 0.8)', color: 'white', padding: '4px 0', fontSize: '12px', fontWeight: 'bold', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                            <FaSpinner className="fa-spin" /> Otomatik Tarama Aktif
                          </div>
                        )}

                        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 20, pointerEvents: 'none' }}>
                          {liveNotifications.map(notif => (
                            <div key={notif.id} style={{
                              background: 'rgba(16, 185, 129, 0.95)', color: 'white', padding: '10px 16px', borderRadius: '30px', 
                              fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)', animation: 'slideDownFade 2.5s forwards'
                            }}>
                              <FaCheckCircle size={18} /> {notif.name} Okundu
                            </div>
                          ))}
                        </div>
                          <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          screenshotQuality={1.0} // Kaliteyi %90'dan %100'e (kayıpsız) çektik
                          videoConstraints={{ 
                            facingMode: facingMode,
                            width: { ideal: 3840, min: 1080 }, // Tarayıcıyı 4K'ya zorla, olmazsa en az 1080p al!
                            height: { ideal: 2160, min: 720 }
                          }} 
                          onUserMedia={handleCameraReady} 
                          style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                        />
  
                       
                      </div>

                      <style>
                        {`
                        @keyframes slideDownFade {
                          0% { opacity: 0; transform: translateY(-20px) scale(0.9); }
                          15% { opacity: 1; transform: translateY(0) scale(1); }
                          80% { opacity: 1; transform: translateY(0) scale(1); }
                          100% { opacity: 0; transform: translateY(-10px) scale(0.9); }
                        }
                        `}
                      </style>

                      <div style={{ textAlign: 'left', background: '#f3f4f6', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ✅ Tanınan Öğrenciler 
                          <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{recognizedNames.length}</span>
                        </h4>
                        {recognizedNames.length === 0 ? (
                          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>Henüz kimse tespit edilmedi...</p>
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
                  {attendanceType === 'FaceRecognition' ? 'Pencereyi Kapat' : 'Kapat'}
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
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
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