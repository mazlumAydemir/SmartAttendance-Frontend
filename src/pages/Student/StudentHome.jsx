import React, { useEffect, useState } from 'react';
import { FaSignOutAlt, FaGraduationCap, FaSpinner, FaBookOpen, FaChalkboardTeacher, FaBell } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './Student.css';
import { useNavigate } from 'react-router-dom';

// 🔥 1. DEĞİŞİKLİK: Normal axios yerine kendi axiosInstance'ımızı ekledik
import axiosInstance from '../../api/axiosInstance';

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

    if (isIOS() && !isInStandaloneMode()) {
      console.warn("iOS'ta bildirim almak için siteyi Ana Ekrana ekleyin.");
      return false;
    }

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
          // 🔥 2. DEĞİŞİKLİK: Firebase Key artık .env dosyasından otomatik okunuyor
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
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

    // 🔥 3. DEĞİŞİKLİK: Uzun url ve manuel header/token gönderimi silindi, axiosInstance kullanıldı
    await axiosInstance.post('/Auth/update-fcm-token', { token: currentToken });

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

  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    // 1. Önce LocalStorage'dan hızlıca (geçici olarak) ekrana bas
    const storedName = localStorage.getItem('fullName');
    const storedNo = localStorage.getItem('schoolNumber');

    if (storedName) {
      const upperName = storedName.toUpperCase();
      setStudentName(upperName);
      const initials = upperName.split(' ').map(word => word[0]).join('').substring(0, 2);
      setStudentInitials(initials);
    }
    if (storedNo) setStudentNo(storedNo);

    // 2. all-users üzerinden kendi verimizi bul ve dersleri çek
    fetchUserDataFromAllUsers();
    fetchStudentCourses();

    if (isIOS() && !isInStandaloneMode()) {
      setShowIOSBanner(true);
    } else if (Notification.permission === 'granted') {
      requestNotificationPermission();
    } else if (Notification.permission === 'default') {
      setShowNotifBanner(true);
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Ön plan mesajı alındı:", payload);
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔥 TÜM KULLANICILARDAN BİZİ BULAN FONKSİYON 🔥
  const fetchUserDataFromAllUsers = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) return;

      // Adım 1: Token'ı parçala ve kendi ID'mizi bul
      let myUserId = null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // ASP.NET standartlarında ID genelde 'nameidentifier', 'id' veya 'sub' olarak geçer
        myUserId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.id || payload.sub;
      } catch (e) {
        console.warn("Token çözümlenemedi.");
      }

      // 🔥 4. DEĞİŞİKLİK: Sadece endpointin kalan adını yazdık, gerisini axiosInstance hallediyor
      const response = await axiosInstance.get('/Auth/all-users');

      const allUsers = response.data;
      let currentUser = null;

      // Adım 3: Listedeki tüm kullanıcılar arasından bizi (ID'mizi) bul
      if (myUserId) {
        currentUser = allUsers.find(u => u.id?.toString() === myUserId.toString());
      } else {
        // Token'dan ID bulamazsak, isme göre eşleşme arayalım (B planı)
        const localName = localStorage.getItem('fullName');
        if (localName) {
          currentUser = allUsers.find(u => (u.fullName === localName || `${u.firstName} ${u.lastName}` === localName));
        }
      }

      // Adım 4: Kullanıcıyı bulduysak ekrana bas ve LocalStorage'ı güncelle
      if (currentUser) {
        const nameFromApi = currentUser.fullName || currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`;
        const noFromApi = currentUser.schoolNumber || currentUser.studentNo;

        if (nameFromApi) {
          const upperName = nameFromApi.toUpperCase();
          setStudentName(upperName);
          const initials = upperName.split(' ').map(word => word[0]).join('').substring(0, 2);
          setStudentInitials(initials);
          localStorage.setItem('fullName', nameFromApi); 
        }

        if (noFromApi) {
          setStudentNo(noFromApi);
          localStorage.setItem('schoolNumber', noFromApi); 
        }
      }
    } catch (err) {
      console.error("all-users endpoint'inden veri çekilemedi:", err);
    }
  };

  const fetchStudentCourses = async () => {
    try {
      // 🔥 5. DEĞİŞİKLİK: Uzun URL ve manuel Token temizlendi, axiosInstance hallediyor.
      const response = await axiosInstance.get('/Attendance/student/my-courses');
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
            {/* Öğrenci Numarası Görüntüleme Alanı */}
            <span className="student-no">{studentNo ? ` ${studentNo}` : "Öğrenci Paneli"}</span>
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