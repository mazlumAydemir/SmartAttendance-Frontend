import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
/* BU IMPORT OLMAZSA BEYAZ EKRAN VERİR */
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BU SARMALAMA (WRAPPER) ŞARTTIR */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)