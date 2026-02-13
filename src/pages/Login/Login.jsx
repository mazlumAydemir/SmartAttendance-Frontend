import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'; // FaEnvelope eklendi
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import AuthLayout from '../../layouts/AuthLayout';

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

      // 2. API'ye İstek Atma (Backend'in beklediği format: LoginDto)
      const response = await axios.post('https://smartattendancerg-c6epc3gfb0g8hcau.francecentral-01.azurewebsites.net/api/auth/login', {
        email: email,      // Backend'deki 'Email' alanı ile eşleşmeli
        password: password // Backend'deki 'Password' alanı ile eşleşmeli
      });

      const data = response.data;
      console.log("Giriş Başarılı:", data);

      // 3. Token ve Bilgileri Kaydetme
      if (data.token) {
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('userRole', data.role); // Rolü de saklayalım (opsiyonel)
        localStorage.setItem('fullName', data.fullName); // İsim bilgisini saklayalım
      }

      // 4. Role Göre Yönlendirme
      // Backend'den 'Teacher', 'Student', 'Admin' gibi string dönüyor.
      const userRole = data.role ? data.role.toLowerCase() : "";

      if (userRole.includes('admin')) {
        navigate('/admin/home');
      } 
      // Backend 'Teacher' veya 'Academician' dönebilir, ikisini de kapsayalım
      else if (userRole.includes('instructor') || userRole.includes('.') || userRole.includes('.')) {
        navigate('/teacher/home');
      } 
      // Backend 'Student' dönebilir
      else if (userRole.includes('student') || userRole.includes('ogr') || userRole.includes('öğrenci')) {
        navigate('/student/home');
      } 
      else {
        setError("Kullanıcı rolü sistemde tanımlı değil: " + data.role);
      }

    } catch (err) {
      console.error("Login Hatası:", err);
      
      // Backend'den gelen özel hata mesajını göstermeye çalışalım
      if (err.response && err.response.data) {
        // Backend throw new Exception("mesaj") fırlattıysa burada yakalayabiliriz
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
          {/* Logo Yolu */}
          <img src="/src/assets/daulogo.jpeg" alt="DAÜ Logo" className="logo" />
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
              <FaEnvelope className="input-icon" /> {/* Zarf ikonu */}
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