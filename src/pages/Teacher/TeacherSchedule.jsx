import React from 'react';
import { FaSignOutAlt, FaClock } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './TeacherSchedule.css';
import { useNavigate } from 'react-router-dom';
const TeacherSchedule = () => {
  const navigate = useNavigate();
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

  // Ders Verileri (Görseldeki dersleri buraya tanımladık)
  const scheduleData = [
    // --- PAZARTESİ ---
    { day: "Pazartesi", time: "08:30 - 09:20", code: "BLGM428/CMPE239", color: "teal" },
    { day: "Pazartesi", time: "10:30 - 11:20", code: "BLGM353/CMPE230", color: "green" },
    { day: "Pazartesi", time: "11:30 - 12:20", code: "BLGM353/CMPE230", color: "green" },

    // --- SALI (Çakışan ders örneği var) ---
    { day: "Salı", time: "08:30 - 09:20", code: "BLGM353/CMPE129", color: "green" },
    { day: "Salı", time: "08:30 - 09:20", code: "BLGM419/CMPE239", color: "orange" }, // Aynı saate ikinci ders
    { day: "Salı", time: "12:30 - 13:20", code: "BLGM371/CMPE028", color: "purple" },
    { day: "Salı", time: "13:30 - 14:20", code: "BLGM371/CMPE028", color: "purple" },

    // --- ÇARŞAMBA ---
    { day: "Çarşamba", time: "08:30 - 09:20", code: "BLGM419/CMPE239", color: "orange" },
    { day: "Çarşamba", time: "10:30 - 11:20", code: "BLGM353/CMPE126", color: "green" },
    { day: "Çarşamba", time: "11:30 - 12:20", code: "BLGM353/CMPE126", color: "green" },
    { day: "Çarşamba", time: "14:30 - 15:20", code: "BLGM428/CMPE239", color: "teal" },
    { day: "Çarşamba", time: "15:30 - 16:20", code: "BLGM428/CMPE239", color: "teal" },

    // --- PERŞEMBE ---
    { day: "Perşembe", time: "08:30 - 09:20", code: "BLGM371/CMPE129", color: "purple" },
    { day: "Perşembe", time: "12:30 - 13:20", code: "EKON111/CL 115", color: "pink" },

    // --- CUMA ---
    { day: "Cuma", time: "10:30 - 11:20", code: "EKON111/CL 117", color: "pink" },
    { day: "Cuma", time: "11:30 - 12:20", code: "EKON111/CL 117", color: "pink" },
    { day: "Cuma", time: "14:30 - 15:20", code: "BLGM371/CMPE025", color: "purple" },
    { day: "Cuma", time: "14:30 - 15:20", code: "EKON111/CL 120", color: "pink" }, // Çakışma örneği
    { day: "Cuma", time: "15:30 - 16:20", code: "BLGM371/CMPE025", color: "purple" },
  ];

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

      {/* Tablo Kapsayıcı */}
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

    </DashboardLayout>
  );
};

export default TeacherSchedule;