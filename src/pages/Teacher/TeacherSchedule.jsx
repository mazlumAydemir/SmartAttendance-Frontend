import React, { useState, useEffect } from 'react';
import { FaSignOutAlt, FaClock, FaSpinner } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './TeacherSchedule.css';
import { useNavigate } from 'react-router-dom';
// 🔥 DEĞİŞİKLİK
import axiosInstance from '../../api/axiosInstance';

const TeacherSchedule = () => {
  const navigate = useNavigate();
  
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);

  const timeSlots = [
    "08:30 - 09:20", "09:30 - 10:20", "10:30 - 11:20", "11:30 - 12:20",
    "12:30 - 13:20", "13:30 - 14:20", "14:30 - 15:20", "15:30 - 16:20",
    "16:30 - 17:20", "17:30 - 18:20"
  ];

  const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

  const dayTranslator = {
    "Monday": "Pazartesi", "Tuesday": "Salı", "Wednesday": "Çarşamba",
    "Thursday": "Perşembe", "Friday": "Cuma", "Saturday": "Cumartesi", "Sunday": "Pazar"
  };

  const getCourseColor = (courseCode) => {
    const colors = ["red", "green", "orange", "purple", "pink", "blue"];
    let hash = 0;
    for (let i = 0; i < courseCode.length; i++) {
      hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        
        // 🔥 DEĞİŞİKLİK
        const response = await axiosInstance.get('/Course/my-timetable');

        const formattedData = response.data.map(item => {
          const timeParts = item.timeSlot.split('-');
          const formattedTime = `${timeParts[0].trim()} - ${timeParts[1].trim()}`;

          return {
            day: dayTranslator[item.day] || item.day, 
            time: formattedTime,
            code: `${item.courseCode} / ${item.classRoom}`, 
            color: getCourseColor(item.courseCode) 
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666', fontSize: '18px' }}>
          <FaSpinner className="spinner-animation fa-spin" style={{ marginRight: '10px' }} />
          Ders programı yükleniyor...
        </div>
      ) : (
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
                    <td className="time-cell">{time}</td>
                    
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