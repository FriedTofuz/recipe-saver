'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function useWakeLock(enabled: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  async function acquire() {
    if (!('wakeLock' in navigator)) {
      toast.info('Screen may sleep during cooking on this browser.')
      return
    }
    try {
      lockRef.current = await navigator.wakeLock.request('screen')
    } catch {
      // Silently fail — not critical
    }
  }

  function release() {
    lockRef.current?.release()
    lockRef.current = null
  }

  useEffect(() => {
    if (!enabled) return

    acquire()

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') acquire()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      release()
    }
  }, [enabled])
}
