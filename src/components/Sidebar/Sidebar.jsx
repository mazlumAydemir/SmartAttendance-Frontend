import React from 'react';
import { 
  FaHome, FaChalkboardTeacher, FaUserGraduate, FaBookOpen, FaClipboardList, 
  FaCalendarAlt, FaCog, FaTimes, FaChartBar, FaClock, FaUser, FaCheckCircle, FaEdit 
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, role = 'admin' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  let portalTitle = 'Admin Portalı';
  if (role === 'teacher') portalTitle = 'Öğretmen Portalı';
  if (role === 'student') portalTitle = 'Öğrenci Portalı';

  // --- LİNKLER ---
  const adminLinks = [
    { icon: <FaHome />, text: 'Ana Sayfa', path: '/admin/home' },
    // ... admin linkleri
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

  let linksToShow = adminLinks;
  if (role === 'teacher') linksToShow = teacherLinks;
  if (role === 'student') linksToShow = studentLinks;

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <img 
          src="https://upload.wikimedia.org/wikipedia/tr/6/66/Dogu_Akdeniz_Universitesi_Logosu.png" 
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
                if(window.innerWidth < 768) toggleSidebar();
              }}
            >
              <span className="menu-icon">{link.icon}</span>
              <span>{link.text}</span>
            </li>
          );
        })}
        {/* ÇIKIŞ BUTONU BURADAN SİLİNDİ */}
      </ul>
    </div>
  );
};

export default Sidebar;