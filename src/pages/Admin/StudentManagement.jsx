import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSignOutAlt, FaSearch, FaFilter, FaPlus, FaEllipsisV, FaGraduationCap, FaBuilding, FaTimes, FaSpinner } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './StudentManagement.css';

const StudentManagement = () => {
    const navigate = useNavigate();
    
    // --- LİSTE VE ARAMA STATE'LERİ ---
    const [stats, setStats] = useState({ totalStudents: 0, activeStudents: 0 });
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // --- MODAL VE FORM STATE'LERİ ---
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [faculties, setFaculties] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        schoolNumber: '',
        departmentId: '',
        profileImage: null // Resim için yeni alan
    });

    // İsimden baş harf çıkaran yardımcı fonksiyon (Resim yoksa çalışır)
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
    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('jwtToken');
            if (!token) return navigate('/');

            const headers = { 'Authorization': `Bearer ${token}` };
            const [statsRes, listRes] = await Promise.all([
                axios.get('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Admin/students/stats', { headers }),
                axios.get('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Admin/students', { headers })
            ]);

            setStats(statsRes.data);
            setStudents(listRes.data);
        } catch (error) {
            console.error("Öğrenci verileri çekilirken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLookups = async () => {
        try {
            const token = localStorage.getItem('jwtToken');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const [facRes, depRes] = await Promise.all([
                axios.get('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Admin/faculties-lookup', { headers }),
                axios.get('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Admin/departments-lookup', { headers })
            ]);
            
            setFaculties(facRes.data);
            setDepartments(depRes.data);
        } catch (error) {
            console.error("Fakülte/Bölüm verileri çekilemedi", error);
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchLookups();
    }, [navigate]);

    // --- YENİ ÖĞRENCİ KAYDETME (RESİMLİ) ---
    const handleAddStudent = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem('jwtToken');
            
            // JSON yerine FormData kullanıyoruz (Resim dosyası gönderebilmek için)
            const submitData = new FormData();
            submitData.append('FullName', formData.fullName);
            submitData.append('Email', formData.email);
            submitData.append('Password', formData.password);
            submitData.append('SchoolNumber', formData.schoolNumber);
            submitData.append('DepartmentId', formData.departmentId);
            
            if (formData.profileImage) {
                submitData.append('ProfileImage', formData.profileImage);
            }

            await axios.post('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Admin/students', submitData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data' // Dosya yükleme formatı
                }
            });

            alert("Öğrenci başarıyla eklendi!");
            setShowModal(false);
            setFormData({ fullName: '', email: '', password: '', schoolNumber: '', departmentId: '', profileImage: null });
            setSelectedFacultyId(''); 
            
            fetchStudents(); // Listeyi yenile
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
        if (!window.confirm(`${fullName} isimli öğrenciyi ${actionText} duruma getirmek istediğinize emin misiniz?`)) return;

        try {
            const token = localStorage.getItem('jwtToken');
            await axios.put(`https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Admin/students/${id}/toggle-status`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchStudents();
        } catch (error) {
            alert("Durum güncellenemedi!");
        }
    };

    const filteredStudents = (students || []).filter(s => 
        s?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s?.schoolNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout role="admin">
            <header className="dashboard-header">
                <h1>Öğrenci Yönetimi</h1>
                <div className="header-actions">
                    <button className="lang-btn">TR</button>
                    <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
                </div>
            </header>

            <div className="student-management-container">
                <div className="sm-stats-row">
                    <div className="sm-stat-box">
                        <span className="sm-stat-label">Toplam Öğrenci</span>
                        <span className="sm-stat-value blue-text">{stats.totalStudents}</span>
                    </div>
                    <div className="sm-stat-box">
                        <span className="sm-stat-label">Aktif Öğrenci</span>
                        <span className="sm-stat-value green-text">{stats.activeStudents}</span>
                    </div>
                </div>

                <div className="sm-actions-row">
                    <button className="sm-btn-filter"><FaFilter /> Filtreleme</button>
                    <button className="sm-btn-add" onClick={() => setShowModal(true)}><FaPlus /> Öğrenci Ekle</button>
                </div>

                <div className="sm-search-bar">
                    <FaSearch className="sm-search-icon" />
                    <input 
                        type="text" 
                        placeholder="Öğrenci ara (Ad, Okul No)" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="sm-loading">Öğrenciler Yükleniyor...</div>
                ) : (
                    <div className="sm-list">
                        {filteredStudents.length === 0 && <div className="sm-no-data">Öğrenci bulunamadı.</div>}
                        
                        {filteredStudents.map(student => (
                            <div className="sm-card" key={student.id}>
                                {/* AVATAR / RESİM GÖSTERİMİ */}
                                <div className="sm-card-avatar" style={student.profilePictureUrl ? { overflow: 'hidden', padding: 0 } : {}}>
                                    {student.profilePictureUrl ? (
                                        <img 
                                            src={`https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net${student.profilePictureUrl}`} 
                                            alt={student.fullName} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    ) : (
                                        getInitials(student.fullName)
                                    )}
                                </div>
                                
                                <div className="sm-card-content">
                                    <div className="sm-card-header">
                                        <h3 className="sm-student-name">{student.fullName}</h3>
                                        <span 
                                            className={`sm-badge ${student.isActive ? 'active' : 'inactive'}`}
                                            onClick={() => handleToggleStatus(student.id, student.isActive, student.fullName)}
                                            style={{ cursor: 'pointer' }}
                                            title="Durumu değiştirmek için tıklayın"
                                        >
                                            {student.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </div>
                                    <div className="sm-student-id">{student.schoolNumber}</div>
                                    <div className="sm-student-footer">
                                        <span className="sm-footer-item"><FaBuilding /> {student.departmentName}</span>
                                        <span className="sm-footer-item"><FaGraduationCap /> {student.gradeLevel}</span>
                                    </div>
                                </div>
                                <div className="sm-card-options"><FaEllipsisV /></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ÖĞRENCİ EKLEME MODALI */}
            {showModal && (
                <div className="sm-modal-overlay">
                    <div className="sm-modal-box">
                        <div className="sm-modal-header">
                            <h2>Yeni Öğrenci Ekle</h2>
                            <FaTimes className="sm-modal-close" onClick={() => setShowModal(false)} />
                        </div>
                        
                        <form onSubmit={handleAddStudent}>
                            {/* DOSYA YÜKLEME ALANI */}
                            <div className="sm-form-group">
                                <label>Profil Resmi (İsteğe Bağlı)</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setFormData({...formData, profileImage: e.target.files[0]})} 
                                />
                            </div>

                            <div className="sm-form-group">
                                <label>Ad Soyad</label>
                                <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Örn: Mazlum Aydemir" />
                            </div>
                            
                            <div className="sm-form-group">
                                <label>E-posta Adresi</label>
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Örn: ogrenci@std.smart.edu.tr" />
                            </div>

                            <div className="sm-form-group">
                                <label>Okul Numarası</label>
                                <input type="text" required value={formData.schoolNumber} onChange={(e) => setFormData({...formData, schoolNumber: e.target.value})} placeholder="Örn: 23002741" />
                            </div>

                            <div className="sm-form-group">
                                <label>Fakülte</label>
                                <select 
                                    value={selectedFacultyId} 
                                    onChange={(e) => {
                                        setSelectedFacultyId(e.target.value);
                                        setFormData({...formData, departmentId: ''});
                                    }}
                                    required
                                >
                                    <option value="">-- Fakülte Seçin --</option>
                                    {faculties.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm-form-group">
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

                            <div className="sm-form-group">
                                <label>Geçici Şifre</label>
                                <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="******" />
                            </div>

                            <div className="sm-modal-footer">
                                <button type="button" className="sm-btn-cancel" onClick={() => setShowModal(false)}>İptal</button>
                                <button type="submit" className="sm-btn-submit" disabled={submitting}>
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

export default StudentManagement;