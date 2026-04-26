import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'; 
import { useNavigate } from 'react-router-dom';

// 🔥 1. DEĞİŞİKLİK: Normal axios yerine kendi axiosInstance'ımızı import ediyoruz
import axiosInstance from '../../api/axiosInstance';

import './Login.css';
import AuthLayout from '../../layouts/AuthLayout';

// 1. ADIM: RESMİ KODA IMPORT EDİYORUZ (Yolunu klasör yapına göre ayarladık)
import dauLogo from '../../assets/daulogo.jpeg';

const Login = () => {
  const navigate = useNavigate();
  
  // State Tanımları (Email ve Şifre)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Yükleniyor ve Hata Durumları
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    // 1. Boş alan kontrolü
    if (!email || !password) {
      setError("Lütfen e-posta ve şifrenizi giriniz.");
      return;
    }

    try {
      setLoading(true);

      // 🔥 2. DEĞİŞİKLİK: Uzun URL silindi, sadece endpoint yazıldı
      const response = await axiosInstance.post('/auth/login', {
        email: email,      
        password: password 
      });

      const data = response.data;
      console.log("Giriş Başarılı:", data);

      // 3. Token ve Bilgileri Kaydetme
      if (data.token) {
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('fullName', data.fullName);
      }

      // 4. Role Göre Yönlendirme
      const userRole = data.role ? data.role.toLowerCase() : "";

      if (userRole.includes('admin')) {
        navigate('/admin/home');
      } 
      else if (userRole.includes('instructor') || userRole.includes('.') || userRole.includes('.')) {
        navigate('/teacher/home');
      } 
      else if (userRole.includes('student') || userRole.includes('ogr') || userRole.includes('öğrenci')) {
        navigate('/student/home');
      } 
      else {
        setError("Kullanıcı rolü sistemde tanımlı değil: " + data.role);
      }

    } catch (err) {
      console.error("Login Hatası:", err);
      
      if (err.response && err.response.data) {
        setError(typeof err.response.data === 'string' ? err.response.data : "Giriş bilgileri hatalı.");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-card">
        <div className="header-section">
          
          {/* 2. ADIM: IMPORT ETTİĞİMİZ RESMİ BURADA KULLANIYORUZ */}
          <img src={dauLogo} alt="DAÜ Logo" className="logo" />
          
          <h1 className="title">Doğu Akdeniz Üniversitesi</h1>
          <h2 className="subtitle">Eastern Mediterranean University</h2>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          
          {/* Hata Mesajı Kutusu */}
          {error && (
            <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* E-posta Alanı */}
          <div className="input-group">
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input 
                type="email" 
                className="form-input" 
                placeholder=" "
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <label className="floating-label">E-posta Adresi</label>
            </div>
          </div>

          {/* Şifre Alanı */}
          <div className="input-group">
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-input" 
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <label className="floating-label">Şifre</label>
              
              <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>

        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;