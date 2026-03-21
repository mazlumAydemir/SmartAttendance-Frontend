import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSignOutAlt, FaUserFriends, FaUserTie, FaGraduationCap, FaUniversity, FaBuilding } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './Reports.css';

const Reports = () => {
    const navigate = useNavigate();

    // Rapor İndirme Fonksiyonu
    const handleDownload = async (reportType) => {
        try {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                navigate('/');
                return;
            }

            // Örnek: Sadece Öğrenci raporu için Backend'e istek atıyoruz
            if (reportType === 'students') {
                // Not: blob responseType'ı, dosya indirme işlemleri için kritik bir ayardır!
                const response = await axios.get('https://localhost:7022/api/Admin/export/students', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    responseType: 'blob' 
                });

                // Gelen veriyi tarayıcıda dosyaya dönüştürüp indirtme hilesi
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'Ogrenci_Raporu.csv'); // İndirilecek dosya adı
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                // Diğer raporlar için şimdilik uyarı verelim
                alert("Bu rapor türü için API henüz hazırlanmadı. Öğrenci raporunu deneyebilirsiniz.");
            }
        } catch (error) {
            console.error("Rapor indirilirken hata:", error);
            alert("Rapor indirilemedi. Yetkinizi kontrol edin.");
        }
    };

    return (
        <DashboardLayout role="admin">
            <header className="dashboard-header">
                <h1>Raporlar</h1>
                <div className="header-actions">
                    <button className="lang-btn">TR</button>
                    <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
                </div>
            </header>

            <div className="reports-container">
                <div className="reports-header-text">
                    <h2>Excel Raporları</h2>
                    <p>Sistemdeki verileri Excel formatında indirin</p>
                </div>

                <div className="reports-list">
                    
                    {/* ÖĞRENCİ RAPORU */}
                    <div className="report-card" onClick={() => handleDownload('students')}>
                        <div className="report-icon-box box-blue">
                            <FaUserFriends className="icon-blue" />
                        </div>
                        <div className="report-content">
                            <h3>Öğrenci Raporları</h3>
                            <p>Öğrenci listesi ve detayları</p>
                        </div>
                    </div>

                    {/* ÖĞRETMEN RAPORU */}
                    <div className="report-card" onClick={() => handleDownload('teachers')}>
                        <div className="report-icon-box box-cyan">
                            <FaUserTie className="icon-cyan" />
                        </div>
                        <div className="report-content">
                            <h3>Öğretmen Raporları</h3>
                            <p>Öğretmen listesi ve dersleri</p>
                        </div>
                    </div>

                    {/* DERS RAPORU */}
                    <div className="report-card" onClick={() => handleDownload('courses')}>
                        <div className="report-icon-box box-purple">
                            <FaGraduationCap className="icon-purple" />
                        </div>
                        <div className="report-content">
                            <h3>Ders Raporları</h3>
                            <p>Ders listesi ve öğrenci sayıları</p>
                        </div>
                    </div>

                    {/* FAKÜLTE RAPORU */}
                    <div className="report-card" onClick={() => handleDownload('faculties')}>
                        <div className="report-icon-box box-orange">
                            <FaUniversity className="icon-orange" />
                        </div>
                        <div className="report-content">
                            <h3>Fakülte Raporları</h3>
                            <p>Fakülte bazlı istatistikler</p>
                        </div>
                    </div>

                    {/* BÖLÜM RAPORU */}
                    <div className="report-card" onClick={() => handleDownload('departments')}>
                        <div className="report-icon-box box-pink">
                            <FaBuilding className="icon-pink" />
                        </div>
                        <div className="report-content">
                            <h3>Bölüm Raporları</h3>
                            <p>Bölüm bazlı istatistikler</p>
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default Reports;