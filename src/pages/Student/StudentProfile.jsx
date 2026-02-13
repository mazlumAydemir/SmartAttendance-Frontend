import React from 'react';
import { FaSignOutAlt, FaCamera, FaLock, FaEnvelope, FaCalendarAlt, FaEdit, FaCheckCircle } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './StudentProfile.css';
import { useNavigate } from 'react-router-dom';
const StudentProfile = () => {
  const navigate = useNavigate();
  // Profil Verileri
  const studentInfo = {
    initials: "HF",
    no: "23002744",
    name: "HALİL İBRAHİM",
    surname: "FİLOĞLU",
    birthPlace: "MARDİN",
    birthDate: "16.1.1998",
    gender: "Male",
    nationality: "TC",
    phone: "+90 555 123 4567",
    status: "Aktif"
  };

  const eduInfo = {
    faculty: "MÜHENDİSLİK FAKÜLTESİ",
    department: "BİLGİSAYAR MÜHENDİSLİĞİ",
    class: "4",
    program: "Türkçe",
    leaveDate: "-",
    regDate: "19.9.2023"
  };

  return (
    <DashboardLayout role="student">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Kişisel Bilgi</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
        </div>
      </header>

      {/* Ana Grid Yapısı (Sol ve Sağ Panel) */}
      <div className="profile-container">
        
        {/* --- SOL PANEL (Avatar ve İşlemler) --- */}
        <div className="profile-left">
          
          {/* Avatar Kartı */}
          <div className="profile-card center-content">
            <div className="profile-avatar-large">
              {studentInfo.initials}
            </div>
            
            {/* Buton Grubu */}
            <div className="profile-actions">
              <button className="action-btn btn-green">
                <FaCamera /> Fotoğraf Güncelle
              </button>
              <button className="action-btn btn-red">
                <FaLock /> Parola Değiştir
              </button>
              <button className="action-btn btn-blue">
                <FaEnvelope /> E-posta
              </button>
            </div>
          </div>

          {/* Hızlı İşlemler */}
          <h3 className="section-label">Hızlı İşlemler</h3>
          <div className="quick-actions-grid">
            <div className="quick-card">
              <FaCalendarAlt className="quick-icon icon-blue" />
              <span className="quick-title">Ders Programı</span>
              <span className="quick-desc">Haftalık program</span>
            </div>
            <div className="quick-card">
              <FaEdit className="quick-icon icon-green" />
              <span className="quick-title">Notlarım</span>
              <span className="quick-desc">Ders notları</span>
            </div>
          </div>
        </div>

        {/* --- SAĞ PANEL (Bilgi Tabloları) --- */}
        <div className="profile-right">
          
          {/* 1. Genel Bilgi Kartı */}
          <div className="profile-card">
            <h3 className="card-title">Genel Bilgi</h3>
            
            <div className="info-row">
              <span className="info-label">Öğrenci Numarası</span>
              <span className="info-value">{studentInfo.no}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Adı</span>
              <span className="info-value">{studentInfo.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Soyadı</span>
              <span className="info-value">{studentInfo.surname}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Doğum Yeri</span>
              <span className="info-value">{studentInfo.birthPlace}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Doğum Tarihi</span>
              <span className="info-value">{studentInfo.birthDate}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Cinsiyet</span>
              <span className="info-value">{studentInfo.gender}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Uyruk</span>
              <span className="info-value">{studentInfo.nationality}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Telefon</span>
              <span className="info-value">{studentInfo.phone}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Durum</span>
              <span className="info-value">
                <span className="status-pill">
                  <FaCheckCircle /> {studentInfo.status}
                </span>
              </span>
            </div>
          </div>

          {/* 2. Öğrenim Bilgisi Kartı */}
          <div className="profile-card">
            <h3 className="card-title">Öğrenim Bilgisi</h3>
            
            <div className="info-row">
              <span className="info-label">Fakülte</span>
              <span className="info-value">{eduInfo.faculty}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Bölüm</span>
              <span className="info-value">{eduInfo.department}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Sınıf</span>
              <span className="info-value">{eduInfo.class}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Program</span>
              <span className="info-value">{eduInfo.program}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Ayrılma Tarihi</span>
              <span className="info-value">{eduInfo.leaveDate}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Kayıt Tarihi</span>
              <span className="info-value">{eduInfo.regDate}</span>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;