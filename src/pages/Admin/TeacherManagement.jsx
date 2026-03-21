import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSignOutAlt, FaSearch, FaFilter, FaPlus, FaEllipsisV, FaBook, FaTimes, FaSpinner } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './TeacherManagement.css';

const TeacherManagement = () => {
    const navigate = useNavigate();
    
    // --- LİSTE VE ARAMA STATE'LERİ ---
    const [stats, setStats] = useState({ totalTeachers: 0, activeTeachers: 0 });
    const [teachers, setTeachers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // --- MODAL VE FORM STATE'LERİ ---
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [faculties, setFaculties] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState(''); // Formda seçilen fakülte

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        schoolNumber: '',
        departmentId: ''
    });

    // İsimden Baş Harf Çıkarma
    const getInitials = (name) => {
        if (!name) return "??";
        const names = name.split(' ');
        let initials = names[0].substring(0, 1).toUpperCase();
        if (names.length > 1) {
            initials += names[names.length - 1].substring(0, 1).toUpperCase();
        }
        return initials;
    };

    // --- VERİ ÇEKME FONKSİYONLARI ---
    const fetchTeachers = async () => {
        try {
            const token = localStorage.getItem('jwtToken');
            if (!token) return navigate('/');

            const headers = { 'Authorization': `Bearer ${token}` };
            const [statsRes, listRes] = await Promise.all([
                axios.get('https://localhost:7022/api/Admin/teachers/stats', { headers }),
                axios.get('https://localhost:7022/api/Admin/teachers', { headers })
            ]);

            setStats(statsRes.data);
            setTeachers(listRes.data);
        } catch (error) {
            console.error("Öğretmenler çekilemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLookups = async () => {
        try {
            const token = localStorage.getItem('jwtToken');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const [facRes, depRes] = await Promise.all([
                axios.get('https://localhost:7022/api/Admin/faculties-lookup', { headers }),
                axios.get('https://localhost:7022/api/Admin/departments-lookup', { headers })
            ]);
            
            setFaculties(facRes.data);
            setDepartments(depRes.data);
        } catch (error) {
            console.error("Fakülte/Bölüm verileri çekilemedi", error);
        }
    };

    // Sayfa Yüklendiğinde Verileri Getir
    useEffect(() => {
        fetchTeachers();
        fetchLookups();
    }, [navigate]);

    // --- YENİ ÖĞRETMEN KAYDETME ---
    const handleAddTeacher = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem('jwtToken');
            await axios.post('https://localhost:7022/api/Admin/teachers', formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert("Öğretmen başarıyla eklendi!");
            setShowModal(false);
            // Formu sıfırla
            setFormData({ fullName: '', email: '', password: '', schoolNumber: '', departmentId: '' });
            setSelectedFacultyId(''); 
            
            fetchTeachers(); // Listeyi yenile
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Bir hata oluştu!";
            alert("Hata: " + errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // --- DURUM (AKTİF/PASİF) DEĞİŞTİRME ---
    const handleToggleStatus = async (id, currentStatus, fullName) => {
        const actionText = currentStatus ? "PASİF" : "AKTİF";
        if (!window.confirm(`${fullName} isimli öğretmeni ${actionText} duruma getirmek istediğinize emin misiniz?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('jwtToken');
            await axios.put(`https://localhost:7022/api/Admin/teachers/${id}/toggle-status`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            fetchTeachers(); // Listeyi yenile
        } catch (error) {
            console.error("Durum güncellenirken hata:", error);
            alert("Durum güncellenemedi!");
        }
    };

    // --- ARAMA FİLTRESİ ---
    const filteredTeachers = (teachers || []).filter(t => 
        t?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t?.schoolNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout role="admin">
            <header className="dashboard-header">
                <h1>Öğretmen Yönetimi</h1>
                <div className="header-actions">
                    <button className="lang-btn">TR</button>
                    <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
                </div>
            </header>

            <div className="teacher-management-container">
                
                {/* ÜST İSTATİSTİKLER */}
                <div className="tm-stats-row">
                    <div className="tm-stat-box">
                        <span className="tm-stat-label">Toplam Öğretmen</span>
                        <span className="tm-stat-value blue-text">{stats.totalTeachers}</span>
                    </div>
                    <div className="tm-stat-box">
                        <span className="tm-stat-label">Aktif Öğretmen</span>
                        <span className="tm-stat-value green-text">{stats.activeTeachers}</span>
                    </div>
                </div>

                {/* BUTONLAR */}
                <div className="tm-actions-row">
                    <button className="tm-btn-filter">
                        <FaFilter /> Filtreleme
                    </button>
                    <button className="tm-btn-add" onClick={() => setShowModal(true)}>
                        <FaPlus /> Öğretmen Ekle
                    </button>
                </div>

                {/* ARAMA ÇUBUĞU */}
                <div className="tm-search-bar">
                    <FaSearch className="tm-search-icon" />
                    <input 
                        type="text" 
                        placeholder="Öğretmen ara (Ad, Sicil No, Email)" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* LİSTE */}
                {loading ? (
                    <div className="tm-loading">Öğretmenler Yükleniyor...</div>
                ) : (
                    <div className="tm-list">
                        {filteredTeachers.length === 0 && (
                            <div className="tm-no-data">Öğretmen bulunamadı.</div>
                        )}
                        
                        {filteredTeachers.map(teacher => (
                            <div className="tm-card" key={teacher.id}>
                                <div className="tm-card-avatar">{getInitials(teacher.fullName)}</div>
                                <div className="tm-card-content">
                                    <div className="tm-card-header">
                                        <h3 className="tm-teacher-name">{teacher.fullName}</h3>
                                        <span 
                                            className={`tm-badge ${teacher.isActive ? 'active' : 'inactive'}`}
                                            onClick={() => handleToggleStatus(teacher.id, teacher.isActive, teacher.fullName)}
                                            style={{ cursor: 'pointer' }}
                                            title="Durumu değiştirmek için tıklayın"
                                        >
                                            {teacher.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </div>
                                    <div className="tm-teacher-id">{teacher.schoolNumber}</div>
                                    <div className="tm-teacher-dept">{teacher.facultyName} - {teacher.departmentName}</div>
                                    <div className="tm-teacher-footer">
                                        <span className="tm-footer-item"><FaBook /> {teacher.courseCount} Ders</span>
                                        <span className="tm-footer-item">{teacher.email}</span>
                                    </div>
                                </div>
                                <div className="tm-card-options"><FaEllipsisV /></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ÖĞRETMEN EKLEME MODALI */}
            {showModal && (
                <div className="tm-modal-overlay">
                    <div className="tm-modal-box">
                        <div className="tm-modal-header">
                            <h2>Yeni Öğretmen Ekle</h2>
                            <FaTimes className="tm-modal-close" onClick={() => setShowModal(false)} />
                        </div>
                        
                        <form onSubmit={handleAddTeacher}>
                            <div className="tm-form-group">
                                <label>Ad Soyad</label>
                                <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Örn: Prof. Dr. Ahmet Yılmaz" />
                            </div>
                            
                            <div className="tm-form-group">
                                <label>E-posta Adresi</label>
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Örn: ahmet.yilmaz@smart.edu.tr" />
                            </div>

                            <div className="tm-form-group">
                                <label>Sicil Numarası</label>
                                <input type="text" required value={formData.schoolNumber} onChange={(e) => setFormData({...formData, schoolNumber: e.target.value})} placeholder="Örn: T2024001" />
                            </div>

                            <div className="tm-form-group">
                                <label>Fakülte</label>
                                <select 
                                    value={selectedFacultyId} 
                                    onChange={(e) => {
                                        setSelectedFacultyId(e.target.value);
                                        setFormData({...formData, departmentId: ''}); // Fakülte değişince bölüm sıfırlanır
                                    }}
                                    required
                                >
                                    <option value="">-- Fakülte Seçin --</option>
                                    {faculties.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="tm-form-group">
                                <label>Bölüm</label>
                                <select 
                                    value={formData.departmentId} 
                                    onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                                    required
                                    disabled={!selectedFacultyId}
                                >
                                    <option value="">-- Bölüm Seçin --</option>
                                    {departments
                                        .filter(d => d.facultyId.toString() === selectedFacultyId.toString())
                                        .map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="tm-form-group">
                                <label>Geçici Şifre</label>
                                <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="******" />
                            </div>

                            <div className="tm-modal-footer">
                                <button type="button" className="tm-btn-cancel" onClick={() => setShowModal(false)}>İptal</button>
                                <button type="submit" className="tm-btn-submit" disabled={submitting}>
                                    {submitting ? <FaSpinner className="fa-spin" /> : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default TeacherManagement;