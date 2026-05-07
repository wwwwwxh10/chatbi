export function AppLogo3D({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bg" x1="14" y1="10" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="0.45" stopColor="#3370FF" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="rib" x1="18" y1="20" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0F2FE" stopOpacity="0.98" />
          <stop offset="0.55" stopColor="#93C5FD" stopOpacity="0.75" />
          <stop offset="1" stopColor="#C7D2FE" stopOpacity="0.65" />
        </linearGradient>
        <radialGradient
          id="spec"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(22 18) rotate(55) scale(38)"
        >
          <stop stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.22" stopColor="#FFFFFF" stopOpacity="0.32" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <filter id="shadow" x="-20" y="-20" width="104" height="104" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.35" />
        </filter>
        <filter id="soft" x="-20" y="-20" width="104" height="104" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 0.92 0 0 0  0 0 1 0 0  0 0 0 0.22 0" />
        </filter>
      </defs>

      <g filter="url(#shadow)">
        <path
          d="M32 6C45.8 6 57 17.2 57 31C57 44.8 45.8 56 32 56C18.2 56 7 44.8 7 31C7 17.2 18.2 6 32 6Z"
          fill="url(#bg)"
        />
        <path
          d="M32 10C44.1 10 54 19.9 54 32C54 44.1 44.1 54 32 54C19.9 54 10 44.1 10 32C10 19.9 19.9 10 32 10Z"
          fill="url(#spec)"
        />
      </g>

      <g filter="url(#soft)">
        <path
          d="M20 35.8C21.9 29.2 27.4 23.6 34.3 21.5C39.4 20 44.5 20.8 48 23.1"
          stroke="url(#rib)"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <path
          d="M16.8 41.2C22.6 45.1 31.1 46.4 38.8 44.2C44.7 42.5 49.2 38.8 51.8 34.6"
          stroke="url(#rib)"
          strokeOpacity="0.9"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
