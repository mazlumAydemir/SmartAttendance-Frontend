import axios from 'axios';

// Tüm istekler için merkezi bir Axios yaratıyoruz
const axiosInstance = axios.create({
    // React arka planda hangi ortamdaysa (.development veya .production) onun linkini otomatik çekecek!
    baseURL: import.meta.env.VITE_API_BASE_URL, 
});

// İSTEĞE BAĞLI BONUS: Her isteğe otomatik Token ekleyen kod!
// Bunu yaparsan sayfalarda sürekli "localStorage.getItem('jwtToken')" yazmana gerek kalmaz.
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;