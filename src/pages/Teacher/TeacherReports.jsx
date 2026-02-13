import React, { useState } from 'react';
import { FaSignOutAlt, FaList, FaStopCircle, FaInfoCircle, FaCalendarAlt, FaClock, FaCalendarDay } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './TeacherReports.css';
import { useNavigate } from 'react-router-dom';
const TeacherReports = () => {
  const navigate = useNavigate();
  // Hangi raporun detayının açık olduğunu tutan state (id tutar)
  const [expandedReportId, setExpandedReportId] = useState(null);

  // Sahte Rapor Verileri
  const reports = [
    {
      id: 1,
      date: '02.12.2025',
      time: '12:30-13:20',
      day: 'Sal',
      courseCode: 'BLGM353',
      courseName: 'Database Management Systems',
      attended: 13,
      total: 28,
      status: 'active', // 'active' veya 'closed'
      progressColor: '#ff9800' // Turuncu
    },
    {
      id: 2,
      date: '27.11.2025',
      time: '08:30-09:20',
      day: 'Per',
      courseCode: 'BLGM371',
      courseName: 'Algoritmaların Çözümlenmesi',
      attended: 14,
      total: 28,
      status: 'closed',
      progressColor: '#ff9800'
    },
    {
      id: 3,
      date: '25.11.2025',
      time: '10:30-11:20',
      day: 'Pzt',
      courseCode: 'BLGM353',
      courseName: 'Database Management Systems',
      attended: 25,
      total: 28,
      status: 'closed',
      progressColor: '#4caf50' // Yeşil
    }
  ];

  // Sahte Öğrenci Listesi (Detay açılınca görünecek)
  const students = [
    { id: 101, name: 'ERDOĞAN KAAN CEYLAN', number: '142349', initials: 'EC', colorClass: 'avatar-blue' },
    { id: 102, name: 'İLKER BARTIN', number: '20330651', initials: 'İB', colorClass: 'avatar-light' },
    { id: 103, name: 'MURAT SERİN', number: '20450022', initials: 'MS', colorClass: 'avatar-light' },
    { id: 104, name: 'AHMET YILMAZ', number: '20450023', initials: 'AY', colorClass: 'avatar-light' },
    { id: 105, name: 'AYŞE DEMİR', number: '20450024', initials: 'AD', colorClass: 'avatar-light' },
  ];

  // Listeyi açıp kapatma fonksiyonu
  const toggleExpand = (id) => {
    if (expandedReportId === id) {
      setExpandedReportId(null); // Zaten açıksa kapat
    } else {
      setExpandedReportId(id); // Değilse aç
    }
  };

  return (
    <DashboardLayout role="teacher">
      <header className="dashboard-header">
        <h1>Raporlar</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')}/>
        </div>
      </header>

      <div className="reports-container">
        <h3 className="page-label">Yoklama Raporları</h3>

        {reports.map((report) => (
          <div key={report.id} className="report-card-wrapper">
            
            {/* --- KARTIN ÜST KISMI (ÖZET) --- */}
            <div className="report-summary">
              
              {/* Etiketler (Tarih, Saat, Gün) */}
              <div className="tags-row">
                <span className="tag tag-blue"><FaCalendarAlt /> {report.date}</span>
                <span className="tag tag-green"><FaClock /> {report.time}</span>
                <span className="tag tag-orange"><FaCalendarDay /> {report.day}</span>
              </div>

              {/* Ders Adı */}
              <h3 className="report-course-title">
                {report.courseCode} - {report.courseName}
              </h3>

              {/* Progress Bar ve Butonlar */}
              <div className="progress-action-row">
                <div className="progress-wrapper">
                  <div className="progress-info">
                    <span>Katılım</span>
                    <span>{report.attended} / {report.total}</span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${(report.attended / report.total) * 100}%`,
                        backgroundColor: report.progressColor 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="action-buttons">
                  {/* Aktif ise Durdur butonu göster */}
                  {report.status === 'active' ? (
                    <button className="btn-stop">
                      Durdur
                    </button>
                  ) : (
                    <span className="status-text">Kapandı</span>
                  )}

                  <button 
                    className={`btn-list ${expandedReportId === report.id ? 'active' : ''}`}
                    onClick={() => toggleExpand(report.id)}
                  >
                    <FaList /> Liste
                  </button>
                </div>
              </div>
            </div>

            {/* --- KARTIN ALT KISMI (DETAY LISTESI) --- */}
            {expandedReportId === report.id && (
              <div className="report-details-panel">
                
                {/* Mavi Bilgi Çubuğu */}
                <div className="info-alert">
                  <FaInfoCircle className="info-alert-icon" />
                  <span>Öğrencilerin yoklama durumlarını işaretleyin: P (Katıldı), A (Katılmadı), E (Mazeretli)</span>
                </div>

                {/* Öğrenci Listesi */}
                <div className="student-rows-container">
                  {students.map((student) => (
                    <div key={student.id} className="student-row-item">
                      
                      {/* Sol: Avatar ve İsim */}
                      <div className="student-left">
                        <div className={`student-avatar-box ${student.colorClass}`}>
                          {student.initials}
                        </div>
                        <div className="student-text-info">
                          <span className="s-name">{student.name}</span>
                          <span className="s-no">{student.number}</span>
                        </div>
                      </div>

                      {/* Sağ: P A E Butonları */}
                      <div className="attendance-actions">
                        <button className="circle-btn">P</button>
                        <button className="circle-btn">A</button>
                        <button className="circle-btn">E</button>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default TeacherReports;