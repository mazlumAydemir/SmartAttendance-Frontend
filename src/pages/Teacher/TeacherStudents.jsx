import React, { useState } from 'react';
import { FaSignOutAlt, FaChevronRight,FaChevronDown } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './TeacherStudents.css'; // Birazdan oluşturacağız
import { useNavigate } from 'react-router-dom';
const TeacherStudents = () => {
  const navigate = useNavigate();
  // Seçili dersi tutmak için state
  const [selectedCourse, setSelectedCourse] = useState('BLGM353');

  // Sahte Öğrenci Verileri (Normalde veritabanından gelir)
  const students = [
    { id: 1, name: 'HALİL İBRAHİM FİLOĞLU', number: '23002744', email: 'halil.filoglu@emu.edu.tr', initials: 'HF' },
    { id: 2, name: 'AHMET YILMAZ', number: '23002745', email: 'ahmet.yilmaz@emu.edu.tr', initials: 'AY' },
    { id: 3, name: 'AYŞE DEMİR', number: '23002746', email: 'ayse.demir@emu.edu.tr', initials: 'AD' },
    { id: 4, name: 'MEHMET KAYA', number: '23002747', email: 'mehmet.kaya@emu.edu.tr', initials: 'MK' },
  ];

  return (
    <DashboardLayout role="teacher">
      {/* Üst Header */}
      <header className="dashboard-header">
        <h1>Öğrencilerim</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
        </div>
      </header>

      {/* Sayfa Başlığı */}
      <h2 className="page-sub-title">Öğrencilerim</h2>

      {/* Ders Seçim Kartı */}
  <div className="filter-card">
        {/* Label sildik çünkü floating label kullanıyoruz */}
        
        <div className="select-wrapper">
            <span className="small-label">Ders</span>
            
            <select 
                className="course-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
            >
                <option value="BLGM353">BLGM353 - Database Management Systems</option>
                <option value="BLGM371">BLGM371 - Algoritmaların Çözümlenmesi</option>
            </select>

            {/* YENİ EKLENEN OK İKONU */}
            <FaChevronDown className="select-arrow" />
        </div>
      </div>

      {/* Öğrenci Listesi Kartı */}
      <div className="student-list-card">
        <div className="card-header">
            <h3>Öğrenci Listesi</h3>
        </div>
        
        <div className="student-list">
          {students.map((student) => (
            <div key={student.id} className="student-item">
              
              {/* Sol Taraf: Avatar ve Bilgiler */}
              <div className="student-info-group">
                <div className="student-avatar">
                  {student.initials}
                </div>
                <div className="student-details">
                  <span className="student-name">{student.name}</span>
                  <span className="student-subtext">Öğrenci No: {student.number}</span>
                  <span className="student-subtext">{student.email}</span>
                </div>
              </div>

              {/* Sağ Taraf: Ok İkonu */}
              <div className="student-action">
                <FaChevronRight />
              </div>

            </div>
          ))}
        </div>
      </div>

    </DashboardLayout>
  );
};

export default TeacherStudents;