import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Dışarıdan erişime izin ver
    allowedHosts: [
      'delaine-ungrooved-yosef.ngrok-free.dev', // Şu anki Ngrok adresin
      '.ngrok-free.dev' // Gelecekteki tüm ngrok adreslerine izin ver (Tavsiye edilen)
    ]
  }
})