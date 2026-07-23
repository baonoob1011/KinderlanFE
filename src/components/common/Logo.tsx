import React from 'react';

export function Logo({ className = "", size = "default" }: { className?: string; size?: "small" | "default" | "large" | "hero" }) {
  // Generate unique IDs for this instance
  const uniqueId = React.useId();
  const id = (name: string) => `${name}-${uniqueId}`;
  
  const sizes = {
    small: { width: 120, height: 40, fontSize: 16 },
    default: { width: 200, height: 66, fontSize: 28 },
    large: { width: 300, height: 100, fontSize: 42 },
    hero: { width: 400, height: 133, fontSize: 56 }
  };

  const { width, height, fontSize } = sizes[size];

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 300 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Gradient cho chữ */}
        <linearGradient id={id("gradient1")} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF1493" />
          <stop offset="100%" stopColor="#FF69B4" />
        </linearGradient>
        <linearGradient id={id("gradient2")} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF8C00" />
          <stop offset="100%" stopColor="#FFA500" />
        </linearGradient>
        <linearGradient id={id("gradient3")} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFEC8B" />
        </linearGradient>
        <linearGradient id={id("gradient4")} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00CED1" />
          <stop offset="100%" stopColor="#40E0D0" />
        </linearGradient>
        <linearGradient id={id("gradient5")} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7FFF00" />
          <stop offset="100%" stopColor="#00FF7F" />
        </linearGradient>
        
        {/* Bóng đổ mềm */}
        <filter id={id("shadow")}>
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
        </filter>
        
        {/* Glow effect */}
        <filter id={id("glow")}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Rainbow gradient */}
        <linearGradient id={id("rainbowGradient")} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF1493" />
          <stop offset="25%" stopColor="#FF8C00" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="75%" stopColor="#00CED1" />
          <stop offset="100%" stopColor="#7FFF00" />
        </linearGradient>
      </defs>

      {/* Khối xếp hình phía sau - màu sắc sáng hơn với gradient */}
      <rect x="8" y="15" width="20" height="20" rx="4" fill="#FF1493" transform="rotate(10 18 25)" filter={`url(#${id("shadow")})`} />
      <circle cx="12" cy="19" r="3" fill="#FFB6C1" opacity="0.6" />
      
      <rect x="22" y="22" width="20" height="20" rx="4" fill="#FF8C00" transform="rotate(-5 32 32)" filter={`url(#${id("shadow")})`} />
      <circle cx="26" cy="26" r="3" fill="#FFE4B5" opacity="0.6" />
      
      <circle cx="20" cy="55" r="12" fill="#00CED1" filter={`url(#${id("shadow")})`} />
      <circle cx="20" cy="52" r="5" fill="#E0FFFF" opacity="0.5" />
      
      <path d="M35 48 L50 58 L35 68 Z" fill="#7FFF00" filter={`url(#${id("shadow")})`} />
      <circle cx="40" cy="58" r="3" fill="#F0FFF0" opacity="0.6" />
      
      {/* Ngôi sao lấp lánh nhiều hơn */}
      <path d="M8 65 L9 68 L12 68 L10 70 L11 73 L8 71 L5 73 L6 70 L4 68 L7 68 Z" fill="#FFD700" filter={`url(#${id("glow")})`} />
      <path d="M48 35 L49 37 L51 37 L49.5 38.5 L50 40 L48 39 L46 40 L46.5 38.5 L45 37 L47 37 Z" fill="#FF69B4" filter={`url(#${id("glow")})`} />
      <path d="M50 68 L51 70 L53 70 L51.5 71.5 L52 73 L50 72 L48 73 L48.5 71.5 L47 70 L49 70 Z" fill="#00CED1" filter={`url(#${id("glow")})`} />
      
      {/* Bóng bay trang trí - sáng hơn với highlight */}
      <ellipse cx="280" cy="20" rx="11" ry="14" fill="#FF1493" filter={`url(#${id("shadow")})`} />
      <ellipse cx="277" cy="17" rx="4" ry="5" fill="#FFB6C1" opacity="0.7" />
      <line x1="280" y1="34" x2="275" y2="55" stroke="#FF1493" strokeWidth="2" />
      <circle cx="275" cy="55" r="2" fill="#FF1493" />
      
      <ellipse cx="265" cy="15" rx="10" ry="13" fill="#FF8C00" filter={`url(#${id("shadow")})`} />
      <ellipse cx="262" cy="12" rx="4" ry="5" fill="#FFE4B5" opacity="0.7" />
      <line x1="265" y1="28" x2="268" y2="48" stroke="#FF8C00" strokeWidth="2" />
      <circle cx="268" cy="48" r="2" fill="#FF8C00" />
      
      <ellipse cx="252" cy="22" rx="9" ry="12" fill="#FFD700" filter={`url(#${id("shadow")})`} />
      <ellipse cx="249" cy="19" rx="3" ry="4" fill="#FFFFE0" opacity="0.7" />
      <line x1="252" y1="34" x2="256" y2="50" stroke="#FFD700" strokeWidth="2" />
      <circle cx="256" cy="50" r="2" fill="#FFD700" />

      {/* Ngôi sao lớn trang trí */}
      <path d="M285 50 L288 58 L296 58 L290 63 L292 71 L285 66 L278 71 L280 63 L274 58 L282 58 Z" fill="#FFD700" filter={`url(#${id("glow")})`} />
      <circle cx="285" cy="60" r="2" fill="#FFFFE0" />
      
      {/* Confetti */}
      <circle cx="55" cy="40" r="2.5" fill="#FF69B4" filter={`url(#${id("glow")})`} />
      <circle cx="245" cy="35" r="2.5" fill="#00CED1" filter={`url(#${id("glow")})`} />
      <rect x="60" y="50" width="4" height="4" rx="1" fill="#FFD700" transform="rotate(20 62 52)" filter={`url(#${id("glow")})`} />
      <rect x="240" y="45" width="4" height="4" rx="1" fill="#7FFF00" transform="rotate(-15 242 47)" filter={`url(#${id("glow")})`} />
      
      {/* Text "Kinderland" với gradient */}
      <text 
        x="150" 
        y="58" 
        fontFamily="Arial, sans-serif" 
        fontSize={fontSize}
        fontWeight="800"
        textAnchor="middle"
        letterSpacing="1"
        filter={`url(#${id("shadow")})`}
      >
        <tspan fill={`url(#${id("gradient1")})`}>K</tspan>
        <tspan fill={`url(#${id("gradient2")})`}>i</tspan>
        <tspan fill={`url(#${id("gradient3")})`}>n</tspan>
        <tspan fill={`url(#${id("gradient4")})`}>d</tspan>
        <tspan fill={`url(#${id("gradient5")})`}>e</tspan>
        <tspan fill={`url(#${id("gradient1")})`}>r</tspan>
        <tspan fill={`url(#${id("gradient2")})`}>l</tspan>
        <tspan fill={`url(#${id("gradient3")})`}>a</tspan>
        <tspan fill={`url(#${id("gradient4")})`}>n</tspan>
        <tspan fill={`url(#${id("gradient5")})`}>d</tspan>
      </text>
      
      {/* Đường cong vui tươi dưới chữ - gradient rainbow */}
      <path 
        d="M 60 72 Q 150 68 240 72" 
        stroke={`url(#${id("rainbowGradient")})`}
        strokeWidth="4" 
        fill="none"
        strokeLinecap="round"
        filter={`url(#${id("glow")})`}
      />
      
      {/* Các chấm trang trí lớn hơn, sáng hơn */}
      <circle cx="55" cy="72" r="4" fill="#FF8C00" filter={`url(#${id("glow")})`} />
      <circle cx="245" cy="72" r="4" fill="#00CED1" filter={`url(#${id("glow")})`} />
      <circle cx="150" cy="68" r="3" fill="#FFD700" filter={`url(#${id("glow")})`} />
    </svg>
  );
}

// Simple Icon version for smaller spaces
export function LogoIcon({ className = '' }: { className?: string }) {
  return <Logo size="small" className={className} />;
}

export default Logo;