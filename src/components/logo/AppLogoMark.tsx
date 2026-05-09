export function AppLogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 26c0-5.523 4.477-10 10-10h16c5.523 0 10 4.477 10 10v10c0 5.523-4.477 10-10 10H33.6l-9.8 7.4c-1.12.85-2.8.05-2.8-1.35V46h-1c-1.105 0-2-.895-2-2V26Z"
        fill="var(--ant-color-primary)"
      />

      <rect x="26" y="28" width="4.6" height="14" rx="2.3" fill="#FFFFFF" fillOpacity="0.92" />
      <rect x="33" y="24" width="4.6" height="18" rx="2.3" fill="#FFFFFF" fillOpacity="0.92" />
      <rect x="40" y="31" width="4.6" height="11" rx="2.3" fill="#FFFFFF" fillOpacity="0.92" />
    </svg>
  )
}
