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
        
        </div>
        
      {children}
    </div>
  );
};

export default AuthLayout;