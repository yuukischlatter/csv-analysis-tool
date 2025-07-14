import React from 'react';

const ApprovalButton = ({ fileName, isApproved, onApprove }) => {
  const handleClick = () => {
    if (!isApproved && onApprove) {
      onApprove(fileName);
    }
  };

  return (
    <div style={{ 
      marginTop: '15px', 
      paddingTop: '15px', 
      borderTop: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ fontSize: '14px', color: '#666' }}>
        {isApproved ? (
          <span style={{ color: 'green', fontWeight: 'bold' }}>
            ✓ This file has been approved
          </span>
        ) : (
          <span>
            Review the chart and click "Approve" when satisfied with the analysis
          </span>
        )}
      </div>
      
      <button
        onClick={handleClick}
        disabled={isApproved}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '4px',
          cursor: isApproved ? 'not-allowed' : 'pointer',
          backgroundColor: isApproved ? '#e0e0e0' : '#4CAF50',
          color: isApproved ? '#999' : 'white',
          transition: 'all 0.2s ease',
          opacity: isApproved ? 0.6 : 1,
          ...(isApproved ? {} : {
            ':hover': {
              backgroundColor: '#45a049'
            }
          })
        }}
        onMouseEnter={(e) => {
          if (!isApproved) {
            e.target.style.backgroundColor = '#45a049';
          }
        }}
        onMouseLeave={(e) => {
          if (!isApproved) {
            e.target.style.backgroundColor = '#4CAF50';
          }
        }}
      >
        {isApproved ? 'Approved ✓' : 'Approve'}
      </button>
    </div>
  );
};

export default ApprovalButton;