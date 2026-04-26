import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaSearch, FaFilter, FaPlus, FaUsers, FaTimes, FaSpinner, FaUserCog, FaCalendarAlt } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './CourseManagement.css';
// 🔥 Değişiklik: axiosInstance eklendi
import axiosInstance from '../../api/axiosInstance';

const PERIODS = [
    { id: 1, start: '08:30', end: '09:20', label: '1. Periyot (08:30 - 09:20)' },
    { id: 2, start: '09:30', end: '10:20', label: '2. Periyot (09:30 - 10:20)' },
    { id: 3, start: '10:30', end: '11:20', label: '3. Periyot (10:30 - 11:20)' },
    { id: 4, start: '11:30', end: '12:20', label: '4. Periyot (11:30 - 12:20)' },
    { id: 5, start: '12:30', end: '13:20', label: '5. Periyot (12:30 - 13:20)' },
    { id: 6, start: '13:30', end: '14:20', label: '6. Periyot (13:30 - 14:20)' },
    { id: 7, start: '14:30', end: '15:20', label: '7. Periyot (14:30 - 15:20)' },
    { id: 8, start: '15:30', end: '16:20', label: '8. Periyot (15:30 - 16:20)' }
];

const daysMap = { 1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe', 5: 'Cuma', 6: 'Cumartesi', 0: 'Pazar' };

const CourseManagement = () => {
    const navigate = useNavigate();
    
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const borderColors = ['#1976d2', '#9c27b0', '#4caf50', '#ff9800', '#f44336'];

    const [showAddModal, setShowAddModal] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [formData, setFormData] = useState({ courseCode: '', courseName: '', departmentId: '', instructorId: '' });

    const [showStudentModal, setShowStudentModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseStudents, setCourseStudents] = useState([]);
    const [savingStudents, setSavingStudents] = useState(false);

    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [locations, setLocations] = useState([]);
    const [existingSchedules, setExistingSchedules] = useState([]);
    const [scheduleFormData, setScheduleFormData] = useState({
        courseId: '',
        dayOfWeek: '1',
        periodId: 1, 
        classLocationId: ''
    });

    const fetchCourses = async () => {
        try {
            // 🔥 Değişiklik
            const res = await axiosInstance.get('/Admin/courses');
            setCourses(res.data);
        } catch (error) { console.error("Dersler çekilirken hata:", error); } 
        finally { setLoading(false); }
    };

    const fetchLookups = async () => {
        try {
            // 🔥 Değişiklik
            const [depRes, instRes, locRes] = await Promise.all([
                axiosInstance.get('/Admin/departments-lookup'),
                axiosInstance.get('/Admin/instructors-lookup'),
                axiosInstance.get('/Admin/class-locations-lookup')
            ]);
            setDepartments(depRes.data);
            setInstructors(instRes.data);
            setLocations(locRes.data);
        } catch (error) { console.error("Açılır listeler çekilemedi:", error); }
    };

    useEffect(() => {
        fetchCourses();
        fetchLookups();
    }, []);

    const handleAddCourse = async (e) => {
        e.preventDefault();
        try {
            // 🔥 Değişiklik
            await axiosInstance.post('/Admin/courses', formData);
            alert("Ders başarıyla eklendi!");
            setShowAddModal(false);
            setFormData({ courseCode: '', courseName: '', departmentId: '', instructorId: '' });
            fetchCourses();
        } catch (error) { alert("Ders eklenirken hata oluştu!"); }
    };

    const openStudentModal = async (course) => {
        setSelectedCourse(course);
        setShowStudentModal(true);
        try {
            // 🔥 Değişiklik
            const res = await axiosInstance.get(`/Admin/courses/${course.id}/students`);
            setCourseStudents(res.data);
        } catch (error) { console.error(error); }
    };

    const handleCheckboxChange = (userId) => {
        setCourseStudents(prev => prev.map(s => 
            s.userId === userId ? { ...s, isEnrolled: !s.isEnrolled } : s
        ));
    };

    const handleSaveStudents = async () => {
        setSavingStudents(true);
        try {
            const selectedIds = courseStudents.filter(s => s.isEnrolled).map(s => s.userId);
            // 🔥 Değişiklik
            await axiosInstance.post(`/Admin/courses/${selectedCourse.id}/assign-students`, selectedIds);
            
            alert("Öğrenciler başarıyla atandı!");
            setShowStudentModal(false);
            fetchCourses(); 
        } catch (error) { alert("Kaydedilirken hata oluştu!"); }
        finally { setSavingStudents(false); }
    };

    const fetchExistingSchedules = async (courseId) => {
        try {
            // 🔥 Değişiklik
            const res = await axiosInstance.get(`/Admin/courses/${courseId}/schedules`);
            setExistingSchedules(res.data);
        } catch (error) { console.error("Programlar çekilemedi:", error); }
    };

    const openScheduleModal = async (course) => {
        setSelectedCourse(course);
        setScheduleFormData({...scheduleFormData, courseId: course.id});
        setShowScheduleModal(true);
        fetchExistingSchedules(course.id);
    };

    const handleAddSchedule = async (e) => {
        e.preventDefault();
        try {
            const selectedPeriod = PERIODS.find(p => p.id === parseInt(scheduleFormData.periodId));

            const payload = {
                courseId: scheduleFormData.courseId,
                dayOfWeek: parseInt(scheduleFormData.dayOfWeek),
                startTime: selectedPeriod.start + ":00",
                endTime: selectedPeriod.end + ":00",
                classLocationId: parseInt(scheduleFormData.classLocationId)
            };

            // 🔥 Değişiklik
            await axiosInstance.post('/Admin/courses/schedule', payload);
            
            alert("Periyot başarıyla eklendi!");
            fetchExistingSchedules(scheduleFormData.courseId); 
            
        } catch (error) { alert("Program eklenirken hata oluştu!"); }
    };

    const filteredCourses = courses.filter(c => 
        c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout role="admin">
            {/* UI kodlarında herhangi bir değişiklik yapılmadı */}
            <header className="dashboard-header">
                <h1>Kurs Yönetimi</h1>
                <div className="header-actions">
                    <button className="lang-btn">TR</button>
                    <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
                </div>
            </header>

            <div className="course-management-container">
                <div className="cm-actions-row">
                    <button className="cm-btn-filter"><FaFilter /> Filtreleme</button>
                    <button className="cm-btn-add" onClick={() => setShowAddModal(true)}><FaPlus /> Ders Ekle</button>
                </div>

                <div className="cm-search-bar">
                    <FaSearch className="cm-search-icon" />
                    <input type="text" placeholder="Ders Kodu veya Adı ile Ara" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                {loading ? <div className="cm-loading">Dersler Yükleniyor...</div> : (
                    <div className="cm-list">
                        {filteredCourses.length === 0 && <div className="cm-no-data">Ders bulunamadı.</div>}
                        
                        {filteredCourses.map((course, index) => {
                            const borderColor = borderColors[index % borderColors.length];
                            return (
                                <div className="cm-card" key={course.id} style={{ borderLeftColor: borderColor }}>
                                    <div className="cm-card-content">
                                        
                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                                            <h3 className="cm-course-name">{course.courseName}</h3>
                                            
                                            <div style={{display: 'flex', gap: '8px'}}>
                                                <button className="cm-btn-assign" onClick={() => openStudentModal(course)} title="Öğrenci Ata">
                                                    <FaUserCog />
                                                </button>
                                                <button className="cm-btn-schedule" onClick={() => openScheduleModal(course)} title="Program Ekle">
                                                    <FaCalendarAlt />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="cm-course-code">{course.courseCode}</div>
                                        <div className="cm-course-footer">
                                            <div className="cm-student-count"><FaUsers className="cm-users-icon" /> {course.studentCount} Öğrenci</div>
                                            <span className={`cm-badge ${course.isActive ? 'active' : 'inactive'}`}>{course.isActive ? 'Aktif' : 'Pasif'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* DERS EKLEME MODALI */}
            {showAddModal && (
                <div className="cm-modal-overlay">
                    <div className="cm-modal-box">
                        <div className="cm-modal-header">
                            <h2>Yeni Ders Ekle</h2>
                            <FaTimes className="cm-modal-close" onClick={() => setShowAddModal(false)} />
                        </div>
                        <form onSubmit={handleAddCourse}>
                            <div className="cm-form-group">
                                <label>Ders Kodu</label>
                                <input type="text" required value={formData.courseCode} onChange={(e) => setFormData({...formData, courseCode: e.target.value})} placeholder="Örn: CMPE428" />
                            </div>
                            <div className="cm-form-group">
                                <label>Ders Adı</label>
                                <input type="text" required value={formData.courseName} onChange={(e) => setFormData({...formData, courseName: e.target.value})} placeholder="Örn: Software Engineering" />
                            </div>
                            <div className="cm-form-group">
                                <label>Bölüm</label>
                                <select required value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})}>
                                    <option value="">-- Bölüm Seç --</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="cm-form-group">
                                <label>Dersi Verecek Hoca</label>
                                <select required value={formData.instructorId} onChange={(e) => setFormData({...formData, instructorId: e.target.value})}>
                                    <option value="">-- Hoca Seç --</option>
                                    {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                            </div>
                            <div className="cm-modal-footer">
                                <button type="button" className="cm-btn-cancel" onClick={() => setShowAddModal(false)}>İptal</button>
                                <button type="submit" className="cm-btn-submit">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ÖĞRENCİ ATAMA MODALI */}
            {showStudentModal && (
                <div className="cm-modal-overlay">
                    <div className="cm-modal-box">
                        <div className="cm-modal-header">
                            <h2>{selectedCourse?.courseName} <br/><small style={{fontSize:'13px', color:'#777'}}>Öğrenci Atama</small></h2>
                            <FaTimes className="cm-modal-close" onClick={() => setShowStudentModal(false)} />
                        </div>
                        
                        <div className="cm-student-checklist">
                            {courseStudents.length === 0 ? <p style={{padding:'10px'}}>Kayıtlı öğrenci bulunamadı.</p> : null}
                            {courseStudents.map(student => (
                                <label key={student.userId} className="cm-checkbox-row">
                                    <input 
                                        type="checkbox" 
                                        checked={student.isEnrolled} 
                                        onChange={() => handleCheckboxChange(student.userId)} 
                                    />
                                    <span>{student.fullName} <small>({student.schoolNumber})</small></span>
                                </label>
                            ))}
                        </div>

                        <div className="cm-modal-footer">
                            <button type="button" className="cm-btn-cancel" onClick={() => setShowStudentModal(false)}>İptal</button>
                            <button type="button" className="cm-btn-submit" onClick={handleSaveStudents} disabled={savingStudents}>
                                {savingStudents ? <FaSpinner className="fa-spin" /> : 'Seçili Öğrencileri Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DERS PROGRAMI (TEK PERİYOT) EKLEME MODALI */}
            {showScheduleModal && (
                <div className="cm-modal-overlay">
                    <div className="cm-modal-box">
                        <div className="cm-modal-header">
                            <h2>{selectedCourse?.courseName} <br/><small style={{fontSize:'13px', color:'#777'}}>Ders Programı</small></h2>
                            <FaTimes className="cm-modal-close" onClick={() => setShowScheduleModal(false)} />
                        </div>

                        {existingSchedules.length > 0 && (
                            <div style={{marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '8px'}}>
                                <h4 style={{margin: '0 0 10px 0', fontSize: '13px', color: '#555'}}>Kayıtlı Oturumlar</h4>
                                {existingSchedules.map(sch => (
                                    <div key={sch.id} style={{fontSize: '13px', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '5px'}}>
                                        <strong>{daysMap[sch.dayOfWeek]}</strong> • {sch.startTime.substring(0,5)} - {sch.endTime.substring(0,5)} • {sch.locationName}
                                    </div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleAddSchedule}>
                            <div className="cm-form-group">
                                <label>Gün</label>
                                <select required value={scheduleFormData.dayOfWeek} onChange={(e) => setScheduleFormData({...scheduleFormData, dayOfWeek: e.target.value})}>
                                    {Object.entries(daysMap).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                                </select>
                            </div>

                            <div className="cm-form-group">
                                <label>Ders Periyodu</label>
                                <select required value={scheduleFormData.periodId} onChange={(e) => setScheduleFormData({...scheduleFormData, periodId: parseInt(e.target.value)})}>
                                    {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                </select>
                            </div>

                            <div className="cm-form-group">
                                <label>Sınıf / Amfi</label>
                                <select required value={scheduleFormData.classLocationId} onChange={(e) => setScheduleFormData({...scheduleFormData, classLocationId: e.target.value})}>
                                    <option value="">-- Sınıf Seç --</option>
                                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                </select>
                            </div>

                            <div className="cm-modal-footer">
                                <button type="button" className="cm-btn-cancel" onClick={() => setShowScheduleModal(false)}>Kapat</button>
                                <button type="submit" className="cm-btn-submit">Programı Ekle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default CourseManagement;