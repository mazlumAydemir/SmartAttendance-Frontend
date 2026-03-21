import React from 'react';
import { 
  FaHome, FaChalkboardTeacher, FaUserGraduate, FaBookOpen, FaClipboardList, 
  FaCalendarAlt, FaCog, FaTimes, FaChartBar, FaClock, FaUser, FaCheckCircle, FaEdit,
  FaMapMarkerAlt // <-- YENİ İKON EKLENDİ
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import dauLogo from '../../assets/daulogo.jpeg';

const Sidebar = ({ isOpen, toggleSidebar, role = 'admin' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  let portalTitle = 'Admin Portalı';
  if (role === 'teacher') portalTitle = 'Öğretmen Portalı';
  if (role === 'student') portalTitle = 'Öğrenci Portalı';

  // --- LİNKLER ---
  const adminLinks = [
    { icon: <FaHome />, text: 'Ana Sayfa', path: '/admin/dashboard' }, 
    { icon: <FaChalkboardTeacher />, text: 'Öğretmenler', path: '/admin/teachers' }, 
    { icon: <FaUserGraduate />, text: 'Öğrenciler', path: '/admin/students' },
    { icon: <FaBookOpen />, text: 'Kurslar', path: '/admin/courses' },
    { icon: <FaMapMarkerAlt />, text: 'Lokasyonlar', path: '/admin/locations' }, // <-- YENİ MENÜ EKLENDİ
    { icon: <FaChartBar />, text: 'Raporlar', path: '/admin/reports' },
    { icon: <FaCog />, text: 'Ayarlar', path: '/admin/settings' },
  ];

  const teacherLinks = [
    { icon: <FaHome />, text: 'Ana Sayfa', path: '/teacher/home' },
    { icon: <FaClipboardList />, text: 'Yoklama', path: '/teacher/attendance' },
    { icon: <FaUserGraduate />, text: 'Öğrencilerim', path: '/teacher/students' },
    { icon: <FaChartBar />, text: 'Raporlar', path: '/teacher/reports' },
    { icon: <FaClock />, text: 'Ders Programı', path: '/teacher/schedule' },
    { icon: <FaCalendarAlt />, text: 'Akademik Takvim', path: '/teacher/calendar' },
  ];

  const studentLinks = [
    { icon: <FaHome />, text: 'Ana Sayfa', path: '/student/home' },
    { icon: <FaUser />, text: 'Kişisel Bilgi', path: '/student/profile' },
    { icon: <FaChartBar />, text: 'Yoklama Durumu', path: '/student/attendance' },
    { icon: <FaClock />, text: 'Ders Programı', path: '/student/schedule' },
    { icon: <FaCheckCircle />, text: 'Aktif Yoklama Girişi', path: '/student/active-attendance' },
    { icon: <FaEdit />, text: 'Notlarım', path: '/student/grades' },
    { icon: <FaCalendarAlt />, text: 'Akademik Takvim', path: '/student/calendar' },
  ];

  // Hangi rol ile girildiyse o menüyü göster
  let linksToShow = adminLinks;
  if (role === 'teacher') linksToShow = teacherLinks;
  if (role === 'student') linksToShow = studentLinks;

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <img 
          src={dauLogo} 
          alt="Logo" 
          className="sidebar-logo" 
        />
        <div className="sidebar-brand">
          <h2>{portalTitle}</h2>
        </div>
        <div className="close-btn" onClick={toggleSidebar}>
            <FaTimes />
        </div>
      </div>

      <ul className="sidebar-menu">
        {linksToShow.map((link, index) => {
          const isActive = location.pathname === link.path;
          return (
            <li 
              key={index} 
              className={`menu-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                navigate(link.path);
                // Mobilde tıklanınca menüyü otomatik kapat
                if(window.innerWidth < 768) toggleSidebar();
              }}
            >
              <span className="menu-icon">{link.icon}</span>
              <span>{link.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;