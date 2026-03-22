/**
 * AuroraBackground.jsx
 * Pure CSS animated aurora gradient background.
 * Now wraps the entire application with floating aurora blobs in the background.
 */
const AuroraBackground = ({ children, className = '' }) => (
  <div className={`aurora-wrap relative min-h-screen w-full overflow-hidden ${className}`}>
    {/* Aurora blobs (fixed to background) */}
    <div className="aurora-blob aurora-blob-1 fixed" />
    <div className="aurora-blob aurora-blob-2 fixed" />
    <div className="aurora-blob aurora-blob-3 fixed" />
    
    {/* Content above aurora */}
    <div className="relative z-10 w-full h-full">
      {children}
    </div>
  </div>
);

export default AuroraBackground;
