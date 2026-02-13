import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa', // Açık gri arka plan
      position: 'relative',
      margin: 0,
      padding: 0
    }}>
        {/* Sağ üstteki TR butonu */}
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
            <button style={{
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                padding: '5px 10px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}>TR</button>
        </div>
        
      {children}
    </div>
  );
};

export default AuthLayout;