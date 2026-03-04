import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Login
import Login from './pages/Login/Login';

// Admin Sayfaları
import DashboardHome from './pages/Dashboard/DashboardHome';

// Öğretmen Sayfaları
import TeacherHome from './pages/Teacher/TeacherHome';
import TeacherAttendance from './pages/Teacher/TeacherAttendance';
import TeacherStudents from './pages/Teacher/TeacherStudents';
import TeacherReports from './pages/Teacher/TeacherReports';
import TeacherSchedule from './pages/Teacher/TeacherSchedule';
import CourseDetailsPage from './pages/Teacher/CourseDetailsPage'; 

// Öğrenci Sayfaları
import StudentHome from './pages/Student/StudentHome';
import StudentProfile from './pages/Student/StudentProfile';
import StudentAttendance from './pages/Student/StudentAttendance';
import StudentActiveAttendance from './pages/Student/StudentActiveAttendance';
import StudentCourseDetailsPage from './pages/Student/StudentCourseDetailsPage';
// 🚀 YENİ EKLENEN IMPORT: Öğrenci Ders Programı Sayfası
import StudentSchedule from './pages/Student/StudentSchedule'; 

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Yapım Aşamasında Bileşeni
const UnderConstruction = ({ title }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#666', textAlign: 'center' }}>
    <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>🚧</h2>
    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>{title}</h2>
    <p>Bu sayfa şu anda geliştirme aşamasındadır.</p>
  </div>
);

function App() {
  return (
    <Routes>
      {/* GİRİŞ ROTASI */}
      <Route path="/" element={<Login />} />

      {/* --- ADMİN ROTALARI --- */}
      <Route path="/admin/home" element={<DashboardHome />} />
      <Route path="/admin/*" element={<DashboardLayout role="admin"><UnderConstruction title="Admin Sayfası" /></DashboardLayout>} />

      {/* --- ÖĞRETMEN ROTALARI --- */}
      <Route path="/teacher/home" element={<TeacherHome />} />
      <Route path="/teacher/course/:courseId" element={<CourseDetailsPage />} />
      <Route path="/teacher/attendance" element={<TeacherAttendance />} />
      <Route path="/teacher/students" element={<TeacherStudents />} />
      <Route path="/teacher/reports" element={<TeacherReports />} />
      <Route path="/teacher/schedule" element={<TeacherSchedule />} />
      <Route path="/teacher/calendar" element={<DashboardLayout role="teacher"><UnderConstruction title="Akademik Takvim" /></DashboardLayout>} />

      {/* --- ÖĞRENCİ ROTALARI --- */}
      <Route path="/student/home" element={<StudentHome />} />
      <Route path="/student/profile" element={<StudentProfile />} />
      <Route path="/student/attendance" element={<StudentAttendance />} />
      <Route path="/student/active-attendance" element={<StudentActiveAttendance />} />
      <Route path="/student/course-details/:courseId" element={<StudentCourseDetailsPage />} /> 
      
      {/* 🚀 GÜNCELLENEN ROTA: Yapım aşamasında yazısı kaldırıldı, gerçek sayfa bağlandı */}
      <Route path="/student/schedule" element={<StudentSchedule />} />
      
      <Route path="/student/grades" element={<DashboardLayout role="student"><UnderConstruction title="Notlarım" /></DashboardLayout>} />
      <Route path="/student/calendar" element={<DashboardLayout role="student"><UnderConstruction title="Akademik Takvim" /></DashboardLayout>} />

      {/* 404 SAYFASI */}
      <Route path="*" element={<div style={{ textAlign: 'center', marginTop: '50px' }}>404 - Sayfa Bulunamadı</div>} />
    </Routes>
  );
}

export default App;