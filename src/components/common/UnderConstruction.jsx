import React from 'react';
import { FaTools } from 'react-icons/fa';

const UnderConstruction = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      color: '#555' 
    }}>
      <FaTools style={{ fontSize: '50px', color: '#ff9800', marginBottom: '20px' }} />
      <h2>Bu Sayfa Yapım Aşamasında</h2>
      <p>Bu özellik çok yakında eklenecek.</p>
    </div>
  );
};

export default UnderConstruction;