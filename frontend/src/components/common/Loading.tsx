interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

function Loading({ message = 'Loading...', fullScreen = false }: LoadingProps) {
  const containerStyle: React.CSSProperties = fullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(11, 16, 26, 0.95)',
        zIndex: 1000,
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner" />
        <p style={{ color: '#9fb0c7', marginTop: '16px', fontSize: '14px' }}>{message}</p>
      </div>
    </div>
  );
}

export default Loading;
