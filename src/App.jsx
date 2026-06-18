import { useIsMobile } from '@/hooks/useIsMobile'
import { DesktopApp } from '@/pages/desktop/DesktopApp'
import { MobileApp } from '@/pages/mobile/MobileApp'

export default function App() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileApp /> : <DesktopApp />
}
