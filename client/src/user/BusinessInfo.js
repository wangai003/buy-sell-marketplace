import React from 'react';

const BusinessInfo = () => {
  const styles = {
    container: {
      background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      backgroundColor: 'white',
      border: '1px solid #FFD700',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      padding: '40px',
      borderRadius: '8px',
      maxWidth: '600px',
      width: '100%',
    },
    title: {
      color: '#228B22',
      fontSize: '2rem',
      marginBottom: '20px',
      textAlign: 'center',
    },
    text: {
      color: '#228B22',
      fontSize: '1.1rem',
      lineHeight: '1.6',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Business Information</h1>
        <p style={styles.text}>This is the business information page.</p>
      </div>
    </div>
  );
};

export default BusinessInfo;