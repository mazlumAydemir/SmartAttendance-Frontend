import React, { useEffect, useState } from 'react';
import { FaSignOutAlt, FaGraduationCap, FaSpinner, FaBookOpen, FaChalkboardTeacher, FaBell } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './Student.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// FIREBASE IMPORTLARI
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../../firebase";

// iOS tespiti
const isIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

// PWA olarak yüklenmiş mi tespiti
const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
};

// BİLDİRİM İZNİ VE TOKEN ALMA FONKSİYONU
const requestNotificationPermission = async () => {
  try {
    console.log("Bildirim izni isteniyor...");

    // iOS + PWA değilse uyar
    if (isIOS() && !isInStandaloneMode()) {
      console.warn("iOS'ta bildirim almak için siteyi Ana Ekrana ekleyin.");
      return false;
    }

    // Tarayıcı desteği kontrolü
    if (!('Notification' in window)) {
      console.error("Bu tarayıcı bildirim desteklemiyor.");
      return false;
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log("Kullanıcı bildirim iznini reddetti.");
      return false;
    }

    console.log("Bildirim izni onaylandı.");

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    console.log("Service Worker aktif ve hazır.");

    let currentToken = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        currentToken = await getToken(messaging, {
          vapidKey: "BIHDqTidttn7oBg5WO7Len5paRRdhG4FPZ6UdEAWvltg-nTrQqCSOY9tRklVpACDavXbJr32Da-It3Q6V80LBTc",
          serviceWorkerRegistration: registration
        });
        break;
      } catch (tokenError) {
        retryCount++;
        console.warn(`getToken denemesi ${retryCount}/${maxRetries} başarısız:`, tokenError.message);

        if (
          tokenError.message?.includes('IDBDatabase') ||
          tokenError.message?.includes('InvalidStateError') ||
          tokenError.message?.includes('closing')
        ) {
          console.log(`${retryCount * 1000}ms beklenip tekrar denenecek...`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        } else {
          console.error("getToken kalıcı hata:", tokenError);
          return false;
        }
      }
    }

    if (!currentToken) {
      console.warn("Token alınamadı. Sayfayı yenileyip tekrar deneyin.");
      return false;
    }

    console.log("FCM Token alındı:", currentToken);

    const jwtToken = localStorage.getItem('jwtToken');
    if (!jwtToken) {
      console.warn("JWT token bulunamadı.");
      return false;
    }

    await axios.post(
      'https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Auth/update-fcm-token',
      { token: currentToken },
      { headers: { Authorization: `Bearer ${jwtToken}` } }
    );

    console.log("FCM Token veritabanına başarıyla kaydedildi!");
    return true;

  } catch (error) {
    if (error.code === 'messaging/permission-blocked') {
      console.error("Bildirim izni tarayıcı tarafından engellenmiş.");
    } else if (error.code === 'messaging/unsupported-browser') {
      console.error("Bu tarayıcı Firebase Messaging'i desteklemiyor.");
    } else {
      console.error("Bildirim ayarlanırken beklenmedik hata:", error);
    }
    return false;
  }
};

const StudentHome = () => {
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState("ÖĞRENCİ");
  const [studentInitials, setStudentInitials] = useState("Ö");
  const [studentNo, setStudentNo] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bildirim banner state'leri
  const [showNotifBanner, setShowNotifBanner] = useState(false);   // Normal izin banner'ı
  const [showIOSBanner, setShowIOSBanner] = useState(false);        // iOS Ana Ekrana Ekle banner'ı
  const [notifLoading, setNotifLoading] = useState(false);          // İzin verme yükleniyor

  useEffect(() => {
    const storedName = localStorage.getItem('fullName');
    const storedNo = localStorage.getItem('schoolNumber');

    if (storedName) {
      const upperName = storedName.toUpperCase();
      setStudentName(upperName);
      const initials = upperName.split(' ').map(word => word[0]).join('').substring(0, 2);
      setStudentInitials(initials);
    }
    if (storedNo) setStudentNo(storedNo);

    fetchStudentCourses();

    // Banner gösterme mantığı
    if (isIOS() && !isInStandaloneMode()) {
      // iOS ama PWA değil → Ana Ekrana Ekle banner'ı
      setShowIOSBanner(true);
    } else if (Notification.permission === 'granted') {
      // İzin zaten var → direkt token al
      requestNotificationPermission();
    } else if (Notification.permission === 'default') {
      // İzin henüz istenmemiş → banner göster
      setShowNotifBanner(true);
    }
    // 'denied' ise hiçbir şey gösterme

    // Uygulama açıkken gelen mesajları yakala
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Ön plan mesajı alındı:", payload);
      // Uygulama açıkken SW çalışmaz, manuel bildirim göster
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchStudentCourses = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(
        'https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/Attendance/student/my-courses',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourses(response.data);
    } catch (err) {
      console.error("Dersler yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifPermission = async () => {
    setNotifLoading(true);
    const success = await requestNotificationPermission();
    setNotifLoading(false);
    setShowNotifBanner(false);
    if (!success && Notification.permission === 'denied') {
      alert("Bildirim izni reddedildi. Tarayıcı ayarlarından manuel olarak açmanız gerekiyor.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleCourseClick = (courseId) => {
    navigate(`/student/course-details/${courseId}`);
  };

  return (
    <DashboardLayout role="student">
      <header className="dashboard-header">
        <h1>Ana Sayfa</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={handleLogout} title="Çıkış Yap" />
        </div>
      </header>

      {/* iOS Ana Ekrana Ekle Banner'ı */}
      {showIOSBanner && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
          color: '#fff',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          position: 'relative'
        }}>
          <span style={{ fontSize: '24px' }}>📱</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '14px' }}>
              iPhone'da Bildirim Almak İçin
            </p>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
              Safari'de <strong>Paylaş (</strong>⬆️<strong>)</strong> butonuna basın →
              <strong> "Ana Ekrana Ekle"</strong> seçin → Uygulamayı ana ekrandan açın
            </p>
          </div>
          <button
            onClick={() => setShowIOSBanner(false)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >✕</button>
        </div>
      )}

      {/* Bildirim İzin Banner'ı */}
      {showNotifBanner && (
        <div style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9f5ff 100%)',
          border: '1px solid #bee3f8',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaBell style={{ color: '#007bff', fontSize: '20px', flexShrink: 0 }} />
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                Yoklama Bildirimleri
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                Yoklama başladığında anında haber alın
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setShowNotifBanner(false)}
              style={{
                background: 'transparent',
                border: '1px solid #ccc',
                borderRadius: '6px',
                padding: '7px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#666'
              }}
            >
              Hayır
            </button>
            <button
              onClick={handleNotifPermission}
              disabled={notifLoading}
              style={{
                background: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 16px',
                cursor: notifLoading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: notifLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {notifLoading ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  Yükleniyor
                </>
              ) : 'İzin Ver'}
            </button>
          </div>
        </div>
      )}

      <div className="student-welcome-card">
        <div className="student-info-left">
          <div className="student-avatar-box">{studentInitials}</div>
          <div>
            <h3>{studentName}</h3>
            <span className="student-no">{studentNo || "Öğrenci Paneli"}</span>
          </div>
        </div>
      </div>

      <div className="courses-container-card">
        <div className="courses-card-header">
          <FaGraduationCap className="courses-header-icon" />
          <h2>Dönem Dersleri</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <FaSpinner className="spinner-animation" style={{ fontSize: '24px', marginBottom: '10px', color: '#007bff' }} />
            <p>Dersler yükleniyor...</p>
          </div>
        ) : (
          <div className="course-list">
            {courses.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                Henüz kayıtlı dersiniz yok.
              </div>
            ) : (
              courses.map((course) => (
                <div
                  key={course.id}
                  className="course-item clickable-course"
                  onClick={() => handleCourseClick(course.id)}
                >
                  <div className="course-icon-wrapper">
                    <FaBookOpen />
                  </div>
                  <div className="course-info">
                    <h3 className="course-title">{course.courseName}</h3>
                    <div className="course-details">
                      <span style={{ fontWeight: 'bold', color: '#007bff', marginRight: '10px' }}>
                        {course.courseCode}
                      </span>
                      <span style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaChalkboardTeacher style={{ marginBottom: '1px' }} /> {course.instructorName}
                      </span>
                    </div>
                  </div>
                  <div className="arrow-icon">›</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        .spinner-animation { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .clickable-course { cursor: pointer; transition: transform 0.2s, background-color 0.2s; display: flex; align-items: center; gap: 15px; }
        .clickable-course:hover { transform: translateX(5px); background-color: #f8f9fa; }
        .course-icon-wrapper { background-color: #e7f1ff; color: #007bff; padding: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .course-info { flex: 1; }
        .course-details { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 4px; }
        .arrow-icon { color: #ccc; font-size: 20px; font-weight: bold; }
      `}</style>
    </DashboardLayout>
  );
};

export default StudentHome;