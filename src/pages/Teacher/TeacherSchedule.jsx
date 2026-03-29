import React, { useState, useEffect } from 'react';
import { FaSignOutAlt, FaClock, FaSpinner } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './TeacherSchedule.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TeacherSchedule = () => {
  const navigate = useNavigate();
  
  // --- STATE TANIMLARI ---
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Saat Dilimleri (Satırlar)
  const timeSlots = [
    "08:30 - 09:20",
    "09:30 - 10:20",
    "10:30 - 11:20",
    "11:30 - 12:20",
    "12:30 - 13:20",
    "13:30 - 14:20",
    "14:30 - 15:20",
    "15:30 - 16:20",
    "16:30 - 17:20",
    "17:30 - 18:20"
  ];

  // Günler (Sütunlar)
  const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

  // Backend'den (C#) İngilizce gelen günleri Türkçeye çeviren sözlük
  const dayTranslator = {
    "Monday": "Pazartesi",
    "Tuesday": "Salı",
    "Wednesday": "Çarşamba",
    "Thursday": "Perşembe",
    "Friday": "Cuma",
    "Saturday": "Cumartesi",
    "Sunday": "Pazar"
  };

  // Derslere göre sabit renk atamak için fonksiyon
  const getCourseColor = (courseCode) => {
    const colors = ["red", "green", "orange", "purple", "pink", "blue"];
    let hash = 0;
    for (let i = 0; i < courseCode.length; i++) {
      hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // --- API'DEN VERİ ÇEKME ---
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('jwtToken');
        
        // 🚀 URL BURADA GÜNCELLENDİ (CourseController'daki my-timetable endpoint'i)
        const response = await axios.get('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Course/my-timetable', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Backend'den gelen veriyi Frontend tablosunun anladığı formata çeviriyoruz
        const formattedData = response.data.map(item => {
          // Backend'den gelen "08:30-09:20" metnini boşluklu "08:30 - 09:20" yap (Tabloyla eşleşsin)
          const timeParts = item.timeSlot.split('-');
          const formattedTime = `${timeParts[0].trim()} - ${timeParts[1].trim()}`;

          return {
            day: dayTranslator[item.day] || item.day, // "Monday" -> "Pazartesi"
            time: formattedTime,
            code: `${item.courseCode} / ${item.classRoom}`, // "BLGM428 / CL 115"
            color: getCourseColor(item.courseCode) // Derse özel renk
          };
        });

        setScheduleData(formattedData);

      } catch (error) {
        console.error("Ders programı çekilirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  // Helper: Belirli bir gün ve saatte ders var mı diye kontrol eder
  const getEventsForCell = (day, time) => {
    return scheduleData.filter(item => item.day === day && item.time === time);
  };

  return (
    <DashboardLayout role="teacher">
      <header className="dashboard-header">
        <h1>Ders Programı</h1>
        <div className="header-actions">
          <button className="lang-btn">TR</button>
          <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
        </div>
      </header>

      {/* Yükleniyor Durumu */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666', fontSize: '18px' }}>
          <FaSpinner className="spinner-animation fa-spin" style={{ marginRight: '10px' }} />
          Ders programı yükleniyor...
        </div>
      ) : (
        /* Tablo Kapsayıcı */
        <div className="schedule-container">
          <div className="table-responsive">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th className="time-header"><FaClock /></th>
                  {days.map(day => (
                    <th key={day} className="day-header">{day.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time, index) => (
                  <tr key={index}>
                    {/* Saat Sütunu */}
                    <td className="time-cell">{time}</td>
                    
                    {/* Gün Sütunları */}
                    {days.map(day => {
                      const events = getEventsForCell(day, time);
                      return (
                        <td key={day} className="schedule-cell">
                          <div className="cell-content">
                            {events.map((event, idx) => (
                              <div key={idx} className={`event-card color-${event.color}`}>
                                {event.code}
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherSchedule;