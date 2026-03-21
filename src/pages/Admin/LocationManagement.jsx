import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSignOutAlt, FaPlus, FaMapMarkerAlt, FaTimes, FaSpinner } from 'react-icons/fa';
import DashboardLayout from '../../layouts/DashboardLayout';
import './LocationManagement.css';

const LocationManagement = () => {
    const navigate = useNavigate();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        roomName: '',
        latitude: '',
        longitude: '',
        fixedRadiusMeters: 50 // Varsayılan 50 metre yarıçap
    });

    const fetchLocations = async () => {
        try {
            const token = localStorage.getItem('jwtToken');
            const res = await axios.get('https://localhost:7022/api/Admin/class-locations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setLocations(res.data);
        } catch (error) {
            console.error("Lokasyonlar çekilemedi", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handleAddLocation = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('jwtToken');
            
            // Virgüllü girişleri (Türkçe format) noktaya çevirip double yapıyoruz
            const payload = {
                roomName: formData.roomName,
                latitude: parseFloat(formData.latitude.toString().replace(',', '.')),
                longitude: parseFloat(formData.longitude.toString().replace(',', '.')),
                fixedRadiusMeters: parseInt(formData.fixedRadiusMeters)
            };

            await axios.post('https://localhost:7022/api/Admin/class-locations', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            alert("Sınıf lokasyonu başarıyla eklendi!");
            setShowModal(false);
            setFormData({ roomName: '', latitude: '', longitude: '', fixedRadiusMeters: 50 });
            fetchLocations();
        } catch (error) {
            alert("Lokasyon eklenirken hata oluştu!");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout role="admin">
            <header className="dashboard-header">
                <h1>Lokasyon Yönetimi</h1>
                <div className="header-actions">
                    <button className="lang-btn">TR</button>
                    <FaSignOutAlt className="logout-icon" onClick={() => navigate('/')} />
                </div>
            </header>

            <div className="location-management-container">
                <div className="lm-actions-row">
                    <button className="lm-btn-add" onClick={() => setShowModal(true)}>
                        <FaPlus /> Yeni Amfi/Sınıf Ekle
                    </button>
                </div>

                <div className="lm-info-banner">
                    <strong>İpucu:</strong> Sınıfların GPS koordinatlarını (Enlem ve Boylam) Google Haritalar üzerinden sağ tıklayıp kopyalayarak alabilirsiniz.
                </div>

                {loading ? <div className="lm-loading">Lokasyonlar Yükleniyor...</div> : (
                    <div className="lm-grid">
                        {locations.length === 0 && <div className="lm-no-data">Kayıtlı lokasyon bulunamadı.</div>}
                        
                        {locations.map((loc) => (
                            <div className="lm-card" key={loc.id}>
                                <div className="lm-card-icon">
                                    <FaMapMarkerAlt />
                                </div>
                                <div className="lm-card-content">
                                    <h3>{loc.roomName}</h3>
                                    <p><strong>Enlem:</strong> {loc.latitude}</p>
                                    <p><strong>Boylam:</strong> {loc.longitude}</p>
                                    <div className="lm-radius-badge">Çap: {loc.fixedRadiusMeters} Metre</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* LOKASYON EKLEME MODALI */}
            {showModal && (
                <div className="lm-modal-overlay">
                    <div className="lm-modal-box">
                        <div className="lm-modal-header">
                            <h2>Yeni Lokasyon Ekle</h2>
                            <FaTimes className="lm-modal-close" onClick={() => setShowModal(false)} />
                        </div>
                        <form onSubmit={handleAddLocation}>
                            
                            <div className="lm-form-group">
                                <label>Sınıf / Amfi Adı</label>
                                <input type="text" required value={formData.roomName} onChange={(e) => setFormData({...formData, roomName: e.target.value})} placeholder="Örn: CMPE-128 veya Amfi 1" />
                            </div>

                            <div style={{display: 'flex', gap: '15px'}}>
                                <div className="lm-form-group" style={{flex: 1}}>
                                    <label>Enlem (Latitude)</label>
                                    <input type="text" required value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} placeholder="Örn: 35.1456" />
                                </div>
                                <div className="lm-form-group" style={{flex: 1}}>
                                    <label>Boylam (Longitude)</label>
                                    <input type="text" required value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} placeholder="Örn: 33.9112" />
                                </div>
                            </div>

                            <div className="lm-form-group">
                                <label>Kabul Edilen Yarıçap (Metre)</label>
                                <input type="number" min="10" required value={formData.fixedRadiusMeters} onChange={(e) => setFormData({...formData, fixedRadiusMeters: e.target.value})} />
                                <small style={{color: '#777', fontSize: '11px', marginTop: '4px', display:'block'}}>
                                    Öğrencinin yoklamaya katılabilmesi için bu konuma en fazla kaç metre uzakta olması gerektiğini belirler.
                                </small>
                            </div>

                            <div className="lm-modal-footer">
                                <button type="button" className="lm-btn-cancel" onClick={() => setShowModal(false)}>İptal</button>
                                <button type="submit" className="lm-btn-submit" disabled={submitting}>
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

export default LocationManagement;