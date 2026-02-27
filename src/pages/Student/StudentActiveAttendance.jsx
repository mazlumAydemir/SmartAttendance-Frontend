import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaSignOutAlt, FaQrcode, FaSmile, FaMapMarkerAlt, FaTimes, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaCamera, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Webcam from "react-webcam";
import jsQR from "jsqr";
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import axios from 'axios';
import DashboardLayout from '../../layouts/DashboardLayout';
import './StudentActiveAttendance.css';
import * as signalR from '@microsoft/signalr';
const StudentActiveAttendance = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  // --- STATE TANIMLARI ---
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Güvenlik Verileri
  const [location, setLocation] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  
  // Form Verileri
  const [qrInput, setQrInput] = useState(""); 

  // Durumlar
  const [loading, setLoading] = useState(false);
  const [fetchingSessions, setFetchingSessions] = useState(true);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [scanResult, setScanResult] = useState(null); 

  // --- 1. BAŞLANGIÇ: CİHAZ ID, KONUM VE LİSTE ÇEKME ---
  useEffect(() => {
    const getDeviceFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setDeviceId(result.visitorId);
      } catch (error) {
        setDeviceId("unknown-device-" + Date.now());
      }
    };

    const getLocation = () => {
      if (!navigator.geolocation) {
        setPermissionError("Tarayıcı konum desteklemiyor.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          setPermissionError("Konum izni verilmedi.");
        },
        { enableHighAccuracy: true }
      );
    };

    const fetchAllActiveSessions = async () => {
      try {
        setFetchingSessions(true);
        const token = localStorage.getItem('jwtToken');
        if (!token) return;

        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // Aktif oturumları VE öğrencinin kendi derslerini (my-courses) aynı anda çekiyoruz
        const reqQR = axios.get('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/student/active-sessions/qr', config);
        const reqLoc = axios.get('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/student/active-sessions/location', config);
        const reqFace = axios.get('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/student/active-sessions/face', config);
        const reqMyCourses = axios.get('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/student/my-courses', config); // YENİ EKLENDİ

        const [resQR, resLoc, resFace, resMyCourses] = await Promise.all([reqQR, reqLoc, reqFace, reqMyCourses]);

        const myCoursesList = resMyCourses.data; // Öğrencinin aldığı dersler listesi

        // Ortak dersleri (CMPE419, BLGM419) öğrencinin aldığı derse göre filtreleme fonksiyonu
        const formatSession = (item, methodType, enumValue) => {
            // Gelen virgüllü metni diziye çeviriyoruz ("CMPE419, BLGM419" -> ["CMPE419", "BLGM419"])
            const sessionCodes = item.courseCode ? item.courseCode.split(',').map(s => s.trim()) : [];
            
            // Öğrencinin bu gruptan aldığı dersi buluyoruz
            const enrolledCourse = myCoursesList.find(c => sessionCodes.includes(c.courseCode));
            
            return {
                ...item,
                methodType,
                enumValue,
                // Eğer eşleşme bulursak SADECE onu yaz, bulamazsak backend'den ne geldiyse onu yaz
                displayCode: enrolledCourse ? enrolledCourse.courseCode : item.courseCode,
                displayName: enrolledCourse ? enrolledCourse.courseName : item.courseName
            };
        };

        const listQR = resQR.data.map(item => formatSession(item, 'QrCode', 1));
        const listLoc = resLoc.data.map(item => formatSession(item, 'Location', 2));
        const listFace = resFace.data.map(item => formatSession(item, 'FaceScan', 3));

        setActiveSessions([...listQR, ...listLoc, ...listFace]);
      } catch (err) {
        console.error("Oturumlar çekilemedi:", err);
        alert("HATA OLUŞTU: " + (err.message || "Bilinmeyen hata"));
        if(err.response) {
            alert("Sunucu Hatası: " + err.response.status); 
        }
      } finally {
        setFetchingSessions(false);
      }
    };
// =========================================================
  // 🚀 SIGNALR: ÖĞRENCİ CANLI DİNLEME (SAYFA YENİLEMEDEN DERS DÜŞMESİ)
  // =========================================================
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/attendanceHub", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log("[SignalR] Öğrenci bağlantısı kuruldu! Canlı dersler dinleniyor...");

        // Hoca yeni ders başlattığında
        connection.on("SessionStarted", () => {
          console.log("[SignalR] Yeni bir ders açıldı! Liste güncelleniyor...");
          // Mevcut fonksiyonunu çağırıp listeyi yeniliyoruz
          // (Eğer ESLint kızarsa fetchAllActiveSessions'ı useEffect dışına/içine alabilirsin)
          window.location.reload(); // En garanti ve hızlı yöntem: Arka planda listeyi tazeletmek istersen fetchAllActiveSessions() yazabilirsin.
        });

        // Hoca dersi bitirdiğinde
        connection.on("SessionEndedGlobal", (sessionId) => {
          console.log(`[SignalR] ${sessionId} numaralı ders kapandı.`);
          setActiveSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        });
      })
      .catch(err => console.error("[SignalR] Bağlantı Hatası:", err));

    return () => {
      connection.stop();
    };
  }, []);
    getDeviceFingerprint();
    getLocation();
    fetchAllActiveSessions();
  }, []);

  // --- 2. OTOMATİK QR TARAMA FONKSİYONU ---
  const scanQR = useCallback(() => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        console.log("QR Bulundu:", code.data);
        setScanResult(code.data); 
        setQrInput(code.data);  
        return true; 
      }
    }
    return false; 
  }, []);

  useEffect(() => {
    let intervalId;
    if (modalOpen && selectedSession?.methodType === 'QrCode' && !scanResult && !loading) {
      intervalId = setInterval(() => {
        const found = scanQR();
        if (found) {
            clearInterval(intervalId); 
        }
      }, 300); 
    }
    return () => clearInterval(intervalId);
  }, [modalOpen, selectedSession, scanResult, loading, scanQR]);

  useEffect(() => {
    if (scanResult && !loading) {
        handleJoinQR(scanResult);
    }
  }, [scanResult]); 


  // --- İŞLEM FONKSİYONLARI ---
  const handleJoinClick = (session) => {
    if (!location || !deviceId) {
      alert("Güvenlik verileri bekleniyor...");
      return;
    }
    setSelectedSession(session);
    setQrInput(""); 
    setScanResult(null); 
    setModalOpen(true);
    setCameraLoading(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSession(null);
    setLoading(false);
    setScanResult(null);
  };

  const handleJoinQR = async (codeToUse = null) => {
    const finalCode = codeToUse || qrInput; 

    if (!finalCode) { alert("QR okunamadı!"); return; }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const payload = {
        sessionId: selectedSession.sessionId,
        qrContent: finalCode,
        deviceId: deviceId,
        latitude: location.latitude,
        longitude: location.longitude
      };

      await axios.post('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/join-qr', payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      alert("✅ BAŞARILI: QR Kod onaylandı, derse katıldınız!");
      handleCloseModal();
    } catch (err) {
      alert("❌ HATA: " + (err.response?.data?.message || err.message));
      setScanResult(null); 
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLocation = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const payload = {
        sessionId: selectedSession.sessionId,
        deviceId: deviceId,
        latitude: location.latitude,
        longitude: location.longitude
      };
      await axios.post('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/join-location', payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert("Konum doğrulandı, derse katıldınız!");
      handleCloseModal();
    } catch (err) {
      alert("Hata: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFace = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) { alert("Fotoğraf çekilemedi!"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "face.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append('SessionId', selectedSession.sessionId);
      formData.append('DeviceId', deviceId);
      formData.append('Latitude', location.latitude);
      formData.append('Longitude', location.longitude);
      formData.append('FaceImage', file);

      await axios.post('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/join-face', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert("Yüz doğrulama başarılı!");
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert("Hata: " + (err.response?.data?.message || "Başarısız."));
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (startDateString) => {
    const start = new Date(startDateString);
    const end = new Date(start.getTime() + 50 * 60000); 
    const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  return (
    <DashboardLayout role="student">
      <header className="dashboard-header">
        <h1>Aktif Yoklamalar</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
        </div>
      </header>

      <div className={`security-status ${location && deviceId ? 'ready' : 'not-ready'}`}>
        {location && deviceId ? (
          <><FaCheckCircle /> Güvenlik Kontrolleri Tamamlandı (GPS + Cihaz ID)</>
        ) : (
          <><FaSpinner className="fa-spin" /> {permissionError ? permissionError : "Konum ve Cihaz ID alınıyor..."}</>
        )}
      </div>

      {fetchingSessions ? (
        <div style={{textAlign:'center', padding:'20px'}}><FaSpinner className="fa-spin"/> Dersler aranıyor...</div>
      ) : activeSessions.length === 0 ? (
        <div style={{textAlign:'center', padding:'20px', color:'#777'}}>Şu anda aktif bir yoklama bulunmamaktadır.</div>
      ) : (
        <div className="sessions-grid">
          {activeSessions.map((session, index) => (
            <div key={`${session.sessionId}-${session.methodType}-${index}`} className="session-card-student">
              <div className={`method-badge ${session.methodType.toLowerCase()}`}>
                {session.methodType === 'QrCode' && <FaQrcode />}
                {session.methodType === 'FaceScan' && <FaSmile />}
                {session.methodType === 'Location' && <FaMapMarkerAlt />}
                <span>{session.methodType === 'QrCode' ? 'QR Kod' : session.methodType === 'FaceScan' ? 'Yüz Tanıma' : 'Konum'}</span>
              </div>
              
              {/* BURADA ARTIK displayCode VE displayName KULLANILIYOR */}
              <h3>{session.displayCode}</h3>
              <h4>{session.displayName}</h4>
              <p className="instructor-name">{session.instructorName}</p>
              
              <div className="session-time" style={{display:'flex', alignItems:'center', gap:'6px'}}>
                <FaClock style={{color: '#666'}} />
                <span style={{fontWeight:'bold', color: '#444'}}>
                   Ders Saati: {formatPeriod(session.startTime)}
                </span>
              </div>

              <button 
                className="btn-join" 
                onClick={() => handleJoinClick(session)}
                disabled={!location || !deviceId}
              >
                Derse Katıl
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && selectedSession && (
        <div className="modal-overlay">
          <div className="attendance-modal-box">
            <div className="modal-header">
              {/* MODAL BAŞLIĞI DA TEMİZLENDİ */}
              <h3>Yoklamaya Katıl: {selectedSession.displayCode}</h3>
              <button className="close-icon" onClick={handleCloseModal}><FaTimes /></button>
            </div>

            <div className="modal-content">
              
              {selectedSession.methodType === 'QrCode' && (
                <div className="camera-container">
                  <p className="instruction">
                    {loading ? "İşleniyor..." : "Lütfen tahtadaki QR Kodu okutun"}
                  </p>
                  
                  <div className="camera-wrapper">
                    {(cameraLoading || loading) && (
                        <div className="camera-loader" style={{background: 'rgba(0,0,0,0.5)', width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <FaSpinner className="fa-spin" size={30}/> 
                            {loading ? " Kaydediliyor..." : " Kamera Açılıyor..."}
                        </div>
                    )}
                    
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: { exact: "environment" } }} 
                      onUserMedia={() => setCameraLoading(false)}
                      onUserMediaError={() => setCameraLoading(false)}
                      className="webcam-view"
                    />
                    
                    <div className="qr-overlay" style={{ borderColor: scanResult ? '#00ff00' : 'rgba(255,255,255,0.8)' }}></div>
                  </div>

                  <div className="qr-input-group">
                    <input 
                      type="text" 
                      placeholder="Kamera okumazsa kodu buraya girin..." 
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      className="qr-manual-input"
                    />
                  </div>
                  
                  <button className="btn-action" onClick={() => handleJoinQR(null)} disabled={loading}>
                    {loading ? <FaSpinner className="fa-spin" /> : "Manuel Gönder"}
                  </button>
                </div>
              )}

              {selectedSession.methodType === 'FaceScan' && (
                <div className="camera-container">
                  <p className="instruction">Yüzünüzü çerçevenin içine getirin</p>
                  <div className="camera-wrapper circle-mask">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: "user" }} 
                      className="webcam-view"
                    />
                  </div>
                  <button className="btn-action" onClick={handleJoinFace} disabled={loading}>
                    {loading ? <FaSpinner className="fa-spin" /> : <><FaCamera /> Fotoğraf Çek ve Katıl</>}
                  </button>
                </div>
              )}

              {selectedSession.methodType === 'Location' && (
                <div className="location-confirm-container">
                  <FaMapMarkerAlt className="big-icon-location" />
                  <p>Mevcut Konumunuz:</p>
                  <div className="lat-long-box">
                    <span>Enlem: {location?.latitude.toFixed(6)}</span>
                    <span>Boylam: {location?.longitude.toFixed(6)}</span>
                  </div>
                  <button className="btn-action" onClick={handleJoinLocation} disabled={loading}>
                    {loading ? <FaSpinner className="fa-spin" /> : "Konumu Doğrula ve Katıl"}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentActiveAttendance;