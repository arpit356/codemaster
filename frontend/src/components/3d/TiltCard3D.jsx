import React, { useRef, useState } from 'react';

/**
 * TiltCard3D
 * Interactive 3D Card with mouse-based tilt perspective, depth layering,
 * and specular lighting reflection.
 */
const TiltCard3D = ({ 
  children, 
  className = '', 
  maxTilt = 12, 
  scale = 1.02, 
  glowColor = 'rgba(99, 102, 241, 0.25)',
  onClick = null 
}) => {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease',
  });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    const rotateX = ((y / rect.height) - 0.5) * -maxTilt;
    const rotateY = ((x / rect.width) - 0.5) * maxTilt;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 0.1s ease-out',
    });

    setGlarePos({
      x: xPercent,
      y: yPercent,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease',
    });
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
      }}
      className={`relative overflow-hidden group cursor-pointer ${className}`}
    >
      {/* Dynamic Specular Glare Glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-30 rounded-[inherit]"
        style={{
          opacity: glarePos.opacity,
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glowColor} 0%, transparent 60%)`,
        }}
      />

      {/* Card Content with 3D Depth support */}
      <div className="relative z-10 w-full h-full transform-style-3d">
        {children}
      </div>
    </div>
  );
};

export default TiltCard3D;
