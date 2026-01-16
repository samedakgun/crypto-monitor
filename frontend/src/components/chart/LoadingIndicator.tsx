interface LoadingIndicatorProps {
  message?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

function LoadingIndicator({
  message = 'Loading historical data...',
  position = 'top-left'
}: LoadingIndicatorProps) {
  const positionClasses: Record<string, string> = {
    'top-left': 'loading-indicator-top-left',
    'top-right': 'loading-indicator-top-right',
    'bottom-left': 'loading-indicator-bottom-left',
    'bottom-right': 'loading-indicator-bottom-right',
    'center': 'loading-indicator-center',
  };

  return (
    <div className={`loading-indicator ${positionClasses[position]}`}>
      <div className="loading-spinner"></div>
      <span className="loading-text">{message}</span>
    </div>
  );
}

export default LoadingIndicator;
