import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    FaSignOutAlt, 
    FaUniversity, 
    FaBuilding, 
    FaGraduationCap, 
    FaChalkboardTeacher, 
    FaUsers, 
    FaCheckCircle, 
    FaTimesCircle, 
    FaUserShield 
} from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalFaculties: 0,
        totalDepartments: 0,
        totalCourses: 0,
        totalTeachers: 0,
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('jwtToken');
                if (!token) {
                    navigate('/'); // Token yoksa login'e at
                    return;
                }

                const response = await axios.get('https://smartattendance-ffhxgvbsd6h7ancr.westeurope-01.azurewebsites.net/api/Admin/dashboard-stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                setStats(response.data);
            } catch (error) {
                console.error("İstatistikler çekilirken hata oluştu:", error);
                alert("Veriler yüklenemedi. Lütfen Admin yetkisiyle girdiğinizden emin olun.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [navigate]);

    return (
        <DashboardLayout role="admin">
            <header className="dashboard-header">
                <h1>Ana Sayfa</h1>
                <div className="header-actions">
                    <button className="lang-btn">TR</button>
                    <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
                </div>
            </header>

            <div className="admin-dashboard-container">
                {/* ÜST PROFİL KARTI */}
                <div className="admin-profile-card">
                    <div className="admin-profile-left">
                        <div className="admin-avatar">
                            <FaUserShield />
                        </div>
                        <div className="admin-info">
                            <h2>ADMIN KULLANICI</h2>
                            <p>Sistem Yöneticisi</p>
                        </div>
                    </div>
                    <div className="admin-profile-right">
                        <span className="badge-active">AKTİF</span>
                    </div>
                </div>

                <h2 className="section-title">Sistem İstatistikleri</h2>

                {loading ? (
                    <div className="loading-spinner">Veriler Yükleniyor...</div>
                ) : (
                    <div className="stats-grid">
                        {/* KART 1: Fakülte */}
                        <div className="stat-card">
                            <div className="stat-icon orange"><FaUniversity /></div>
                            <div className="stat-number orange-text">{stats.totalFaculties}</div>
                            <div className="stat-label">Toplam Fakülte</div>
                        </div>

                        {/* KART 2: Bölüm */}
                        <div className="stat-card">
                            <div className="stat-icon purple"><FaBuilding /></div>
                            <div className="stat-number purple-text">{stats.totalDepartments}</div>
                            <div className="stat-label">Toplam Bölüm</div>
                        </div>

                        {/* KART 3: Ders */}
                        <div className="stat-card">
                            <div className="stat-icon dark-purple"><FaGraduationCap /></div>
                            <div className="stat-number dark-purple-text">{stats.totalCourses}</div>
                            <div className="stat-label">Toplam Ders</div>
                        </div>

                        {/* KART 4: Öğretmen */}
                        <div className="stat-card">
                            <div className="stat-icon teal"><FaChalkboardTeacher /></div>
                            <div className="stat-number teal-text">{stats.totalTeachers}</div>
                            <div className="stat-label">Toplam Öğretmen</div>
                        </div>

                        {/* KART 5: Öğrenci */}
                        <div className="stat-card">
                            <div className="stat-icon blue"><FaUsers /></div>
                            <div className="stat-number blue-text">{stats.totalStudents}</div>
                            <div className="stat-label">Toplam Öğrenci</div>
                        </div>

                        {/* KART 6: Aktif Öğrenci */}
                        <div className="stat-card">
                            <div className="stat-icon green"><FaCheckCircle /></div>
                            <div className="stat-number green-text">{stats.activeStudents}</div>
                            <div className="stat-label">Aktif Öğrenci</div>
                        </div>

                        {/* KART 7: Pasif Öğrenci */}
                        <div className="stat-card">
                            <div className="stat-icon red"><FaTimesCircle /></div>
                            <div className="stat-number red-text">{stats.inactiveStudents}</div>
                            <div className="stat-label">Pasif Öğrenci</div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;