/**
 * ShineBorder.jsx
 * Animated conic-gradient border glow effect.
 * Usage: Wrap key dashboard cards, ECO pending status, admin alerts.
 *
 * Props:
 *   colors   — array of CSS colors for the gradient (default: blue/purple)
 *   borderWidth — px width of the shine border (default: 2)
 *   duration    — animation duration in seconds (default: 4)
 *   className   — extra classes for the outer wrapper
 *   children    — inner content
 */
const ShineBorder = ({
  children,
  colors = ['#0077B6', '#7C3AED', '#00B4D8'],
  borderWidth = 2,
  duration = 4,
  className = '',
}) => {
  const gradient = `conic-gradient(from var(--shine-angle), ${colors.join(', ')}, ${colors[0]})`;

  return (
    <div
      className={`shine-border-wrap relative rounded-2xl ${className}`}
      style={{
        padding: borderWidth,
        background: gradient,
        '--shine-duration': `${duration}s`,
      }}
    >
      <div className="relative rounded-[14px] bg-white h-full">
        {children}
      </div>
    </div>
  );
};

export default ShineBorder;
