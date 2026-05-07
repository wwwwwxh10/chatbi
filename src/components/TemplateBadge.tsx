export function TemplateBadge({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="b" x1="10" y1="4" x2="32" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2DA7FF" />
          <stop offset="1" stopColor="#4ED0FF" />
        </linearGradient>
        <filter id="sh" x="-20" y="-20" width="84" height="84" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.28" />
        </filter>
      </defs>

      <g filter="url(#sh)">
        <path d="M10 4H32C34.2 4 36 5.8 36 8V28L22 40L8 28V8C8 5.8 9.8 4 12 4H10Z" fill="url(#b)" />
        <path d="M22 36.5L12 27.8V9C12 7.9 12.9 7 14 7H30C31.1 7 32 7.9 32 9V27.8L22 36.5Z" fill="#EAF6FF" fillOpacity="0.95" />
        <path
          d="M22 14.6L23.7 18.1L27.6 18.7L24.8 21.4L25.5 25.2L22 23.4L18.5 25.2L19.2 21.4L16.4 18.7L20.3 18.1L22 14.6Z"
          fill="#2B5CF6"
          fillOpacity="0.85"
        />
      </g>
    </svg>
  )
}

