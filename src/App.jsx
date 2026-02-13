import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- 1. GİRİŞ SAYFASI ---
import Login from './pages/Login/Login';

// --- 2. ADMİN SAYFALARI ---
import DashboardHome from './pages/Dashboard/DashboardHome';

// --- 3. ÖĞRETMEN SAYFALARI ---
import TeacherHome from './pages/Teacher/TeacherHome';
import TeacherAttendance from './pages/Teacher/TeacherAttendance';
import TeacherStudents from './pages/Teacher/TeacherStudents';
import TeacherReports from './pages/Teacher/TeacherReports';
import TeacherSchedule from './pages/Teacher/TeacherSchedule';

// --- 4. ÖĞRENCİ SAYFALARI ---
import StudentHome from './pages/Student/StudentHome';
import StudentProfile from './pages/Student/StudentProfile';
import StudentAttendance from './pages/Student/StudentAttendance';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// --- GEÇİCİ "YAPIM AŞAMASINDA" BİLEŞENİ ---
const UnderConstruction = ({ title }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '60vh', 
    color: '#666',
    textAlign: 'center'
  }}>
    <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>🚧</h2>
    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>{title}</h2>
    <p>Bu sayfa şu anda geliştirme aşamasındadır.</p>
  </div>
);

function App() {
  return (
    <Routes>
      {/* --- GİRİŞ --- */}
      <Route path="/" element={<Login />} />

      {/* --- ADMİN ROTALARI --- */}
      <Route path="/admin/home" element={<DashboardHome />} />
      <Route path="/admin/*" element={<DashboardLayout role="admin"><UnderConstruction title="Admin Sayfası" /></DashboardLayout>} />

      {/* --- ÖĞRETMEN ROTALARI --- */}
      <Route path="/teacher/home" element={<TeacherHome />} />
      <Route path="/teacher/attendance" element={<TeacherAttendance />} />
      <Route path="/teacher/students" element={<TeacherStudents />} />
      <Route path="/teacher/reports" element={<TeacherReports />} />
      <Route path="/teacher/schedule" element={<TeacherSchedule />} />
      <Route path="/teacher/calendar" element={<DashboardLayout role="teacher"><UnderConstruction title="Akademik Takvim" /></DashboardLayout>} />

      {/* --- ÖĞRENCİ ROTALARI --- */}
      <Route path="/student/home" element={<StudentHome />} />
      <Route path="/student/profile" element={<StudentProfile />} />
      <Route path="/student/attendance" element={<StudentAttendance />} />
      
      <Route path="/student/schedule" element={<DashboardLayout role="student"><UnderConstruction title="Ders Programı" /></DashboardLayout>} />
      <Route path="/student/active-attendance" element={<DashboardLayout role="student"><UnderConstruction title="Aktif Yoklama Girişi" /></DashboardLayout>} />
      <Route path="/student/grades" element={<DashboardLayout role="student"><UnderConstruction title="Notlarım" /></DashboardLayout>} />
      <Route path="/student/calendar" element={<DashboardLayout role="student"><UnderConstruction title="Akademik Takvim" /></DashboardLayout>} />

      {/* --- 404 --- */}
      <Route path="*" element={<div style={{ textAlign: 'center', marginTop: '50px' }}>404 - Sayfa Bulunamadı</div>} />
    </Routes>
  );
}

export default App;