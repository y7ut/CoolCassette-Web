import { WindowMinimise, WindowToggleMaximise, Quit } from '../wailsjs/runtime/runtime'

const isDesktop = import.meta.env.VITE_TRANSPORT === 'wails'
const isWindows = isDesktop && navigator.userAgent.includes('Windows')

export default function TitleBar() {
  if (isWindows) {
    return (
      <div className="titlebar">
        <div className="titlebar-drag" />
        <div className="titlebar-controls">
          <button className="titlebar-btn" onClick={() => WindowMinimise()} aria-label="Minimize">─</button>
          <button className="titlebar-btn" onClick={() => WindowToggleMaximise()} aria-label="Maximize">□</button>
          <button className="titlebar-btn titlebar-btn-close" onClick={() => Quit()} aria-label="Close">✕</button>
        </div>
      </div>
    )
  }

  if (isDesktop) {
    return <div className="titlebar-mac" />
  }

  return null
}
