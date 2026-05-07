export function AppLogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chatbi_mark_g" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ant-color-primary)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--ant-color-primary)" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      <path
        d="M20 25C20 21.686 22.686 19 26 19H38C41.314 19 44 21.686 44 25V33C44 36.314 41.314 39 38 39H30L24.2 43.4C23.54 43.9 22.6 43.43 22.6 42.6V39H26"
        stroke="var(--ant-color-text-secondary)"
        strokeOpacity="0.85"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M41 20.5L43.2 25.4L48.1 27.6L43.2 29.8L41 34.7L38.8 29.8L33.9 27.6L38.8 25.4L41 20.5Z"
        fill="url(#chatbi_mark_g)"
        opacity="0.92"
      />

      <rect x="28" y="28" width="4" height="10" rx="2" fill="var(--ant-color-text)" fillOpacity="0.55" />
      <rect x="35" y="25" width="4" height="13" rx="2" fill="url(#chatbi_mark_g)" />
      <rect x="21" y="31" width="4" height="7" rx="2" fill="var(--ant-color-text)" fillOpacity="0.42" />

      <path
        d="M24 24.2H34"
        stroke="var(--ant-color-primary)"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  )
}
