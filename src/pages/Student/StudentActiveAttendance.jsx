import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaSignOutAlt, FaQrcode, FaMapMarkerAlt, FaTimes, FaSpinner, FaCheckCircle, FaClock } from 'react-icons/fa';
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
  
  // Durumlar
  const [loading, setLoading] = useState(false);
  const [fetchingSessions, setFetchingSessions] = useState(true);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [scanResult, setScanResult] = useState(null); 

  // 1. VERİ ÇEKME FONKSİYONU (Yüz Tanıma Kaldırıldı, safeFetch eklendi)
  const fetchAllActiveSessions = useCallback(async () => {
    try {
      setFetchingSessions(true);
      const token = localStorage.getItem('jwtToken');
      if (!token) return;

      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      // Herhangi bir API hata verirse çökmek yerine boş dizi döndürür
      const safeFetch = (url) => axios.get(url, config).catch(err => {
          console.warn(`[UYARI] ${url} çekilemedi:`, err.message);
          return { data: [] }; 
      });

      const [resQR, resLoc, resMyCourses] = await Promise.all([
        safeFetch('https://localhost:7022/api/Attendance/student/active-sessions/qr'),
        safeFetch('https://localhost:7022/api/Attendance/student/active-sessions/location'),
        safeFetch('https://localhost:7022/api/Attendance/student/my-courses')
      ]);

      const myCoursesList = Array.isArray(resMyCourses.data) ? resMyCourses.data : [];

      const formatSession = (item, methodType, enumValue) => {
          const sessionCodes = item.courseCode ? item.courseCode.split(',').map(s => s.trim()) : [];
          const enrolledCourse = myCoursesList.find(c => sessionCodes.includes(c.courseCode));
          
          return {
              ...item,
              methodType,
              enumValue,
              displayCode: enrolledCourse ? enrolledCourse.courseCode : item.courseCode,
              displayName: enrolledCourse ? enrolledCourse.courseName : item.courseName
          };
      };

      const listQR = Array.isArray(resQR.data) ? resQR.data.map(item => formatSession(item, 'QrCode', 1)) : [];
      const listLoc = Array.isArray(resLoc.data) ? resLoc.data.map(item => formatSession(item, 'Location', 2)) : [];

      setActiveSessions([...listQR, ...listLoc]);
    } catch (err) {
      console.error("Genel bir hata oluştu:", err);
    } finally {
      setFetchingSessions(false);
    }
  }, []);

  // 2. BAŞLANGIÇ GÜVENLİK AYARLARI
  useEffect(() => {
    let isMounted = true; 

    const getDeviceFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        if (isMounted) setDeviceId(result.visitorId);
      } catch (error) {
        if (isMounted) setDeviceId("unknown-device-" + Date.now());
      }
    };

    const getLocation = () => {
      if (!navigator.geolocation) {
        if (isMounted) setPermissionError("Tarayıcı konum desteklemiyor.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMounted) {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        },
        () => {
          if (isMounted) setPermissionError("Konum izni verilmedi.");
        },
        { enableHighAccuracy: true }
      );
    };

    getDeviceFingerprint();
    getLocation();
    fetchAllActiveSessions();

    return () => { isMounted = false; };
  }, [fetchAllActiveSessions]);

  // 3. SIGNALR BAĞLANTISI
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
        connection.on("SessionStarted", () => {
          setTimeout(() => {
              fetchAllActiveSessions();
          }, 500); 
        });

        connection.on("SessionEndedGlobal", (sessionId) => {
          setActiveSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        });
      })
      .catch(err => console.error("[SignalR] Bağlantı Hatası:", err));

    return () => { connection.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // --- 4. OTOMATİK QR TARAMA FONKSİYONU ---
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
        setScanResult(code.data); 
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
        if (found) clearInterval(intervalId); 
      }, 300); 
    }
    return () => clearInterval(intervalId);
  }, [modalOpen, selectedSession, scanResult, loading, scanQR]);

  useEffect(() => {
    if (scanResult && !loading) {
        handleJoinQR(scanResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanResult]); 

  // --- 5. İŞLEM FONKSİYONLARI ---
  const handleJoinClick = (session) => {
    if (!location || !deviceId) {
      alert("Güvenlik verileri (Konum ve Cihaz ID) bekleniyor. Lütfen tarayıcı izinlerinizi kontrol edin.");
      return;
    }
    setSelectedSession(session);
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

  const handleJoinQR = async (scannedCode) => {
    if (!scannedCode) return; 
    
    setLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const payload = {
        sessionId: selectedSession.sessionId,
        qrContent: scannedCode,
        deviceId: deviceId,
        latitude: location.latitude,
        longitude: location.longitude
      };

      await axios.post('https://localhost:7022/api/Attendance/join-qr', payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      alert("✅ BAŞARILI: QR Kod onaylandı, derse katıldınız!");
      handleCloseModal();
      fetchAllActiveSessions();
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
      await axios.post('https://localhost:7022/api/Attendance/join-location', payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert("✅ BAŞARILI: Konum doğrulandı, derse katıldınız!");
      handleCloseModal();
      fetchAllActiveSessions();
    } catch (err) {
      alert("❌ HATA: " + (err.response?.data?.message || err.message));
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
                {session.methodType === 'Location' && <FaMapMarkerAlt />}
                <span>{session.methodType === 'QrCode' ? 'QR Kod' : 'Konum'}</span>
              </div>
              
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
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="attendance-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '18px' }}>Yoklamaya Katıl: {selectedSession.displayCode}</h3>
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
                        <div className="camera-loader">
                            <FaSpinner className="fa-spin" size={30}/> 
                            <p style={{ marginTop: '10px' }}>{loading ? "Kaydediliyor..." : "Kamera Açılıyor..."}</p>
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
                    
                    <div className="qr-overlay" style={{ borderColor: scanResult ? '#4caf50' : 'rgba(255,255,255,0.7)' }}></div>
                  </div>
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