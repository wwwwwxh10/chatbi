import { AppLogoMark } from './AppLogoMark'

export function AppLogoWordmark({ size = 28, fontSize = 18, showMark = true }: { size?: number; fontSize?: number; showMark?: boolean }) {
  return (
    <div className="appWordmark" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      {showMark ? <AppLogoMark size={size} /> : null}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, lineHeight: 1 }}>
        <span style={{ fontSize, fontWeight: 720, letterSpacing: 0.2 }}>Chat</span>
        <span className="appWordmarkBI" style={{ fontSize, fontWeight: 800, letterSpacing: 0.3 }}>
          BI
        </span>
      </div>
    </div>
  )
}
