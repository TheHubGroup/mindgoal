import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'

interface VimeoPlayerProps {
  videoId: string
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onReady?: (duration: number) => void
  onSeek?: (fromTime: number, toTime: number) => void
  className?: string
}

interface VimeoPlayerRef {
  restart: () => Promise<void>
  getCurrentTime: () => Promise<number>
  getDuration: () => Promise<number>
  play: () => Promise<void>
  pause: () => Promise<void>
}

declare global {
  interface Window {
    Vimeo: any
  }
}

const VimeoPlayer = forwardRef<VimeoPlayerRef, VimeoPlayerProps>(({
  videoId,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onReady,
  onSeek,
  className = ''
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<any>(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [lastTime, setLastTime] = useState(0)
  const [key, setKey] = useState(0) // Para forzar re-render si es necesario

  // Exponer métodos públicos a través de ref
  useImperativeHandle(ref, () => ({
    restart: async () => {
      if (playerRef.current) {
        try {
          await playerRef.current.setCurrentTime(0)
          setLastTime(0)
          console.log('Video restarted successfully')
        } catch (error) {
          console.error('Error restarting video:', error)
        }
      }
    },
    getCurrentTime: async () => {
      if (playerRef.current) {
        try {
          return await playerRef.current.getCurrentTime()
        } catch (error) {
          console.error('Error getting current time:', error)
          return 0
        }
      }
      return 0
    },
    getDuration: async () => {
      if (playerRef.current) {
        try {
          return await playerRef.current.getDuration()
        } catch (error) {
          console.error('Error getting duration:', error)
          return 0
        }
      }
      return 0
    },
    play: async () => {
      if (playerRef.current) {
        try {
          await playerRef.current.play()
        } catch (error) {
          console.error('Error playing video:', error)
        }
      }
    },
    pause: async () => {
      if (playerRef.current) {
        try {
          await playerRef.current.pause()
        } catch (error) {
          console.error('Error pausing video:', error)
        }
      }
    }
  }), [])

  useEffect(() => {
    // Cargar el script de Vimeo Player si no está cargado
    if (!window.Vimeo) {
      const script = document.createElement('script')
      script.src = 'https://player.vimeo.com/api/player.js'
      script.onload = initializePlayer
      document.head.appendChild(script)
    } else {
      initializePlayer()
    }

    return () => {
      // Solo destruir el player si el componente se desmonta completamente
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
          playerRef.current = null
        } catch (error) {
          console.error('Error destroying player:', error)
        }
      }
    }
  }, [videoId, key]) // Incluir key para re-inicializar si es necesario

  const initializePlayer = () => {
    if (!iframeRef.current || !window.Vimeo) return

    try {
      // Destruir player anterior si existe
      if (playerRef.current) {
        playerRef.current.destroy()
      }

      playerRef.current = new window.Vimeo.Player(iframeRef.current)

      // Configurar eventos
      playerRef.current.on('loaded', async () => {
        setIsPlayerReady(true)
        try {
          const duration = await playerRef.current.getDuration()
          onReady?.(duration)
          console.log('Player loaded, duration:', duration)
        } catch (error) {
          console.error('Error getting duration:', error)
        }
      })

      playerRef.current.on('play', () => {
        console.log('Video playing')
        onPlay?.()
      })

      playerRef.current.on('pause', () => {
        console.log('Video paused')
        onPause?.()
      })

      playerRef.current.on('ended', () => {
        console.log('Video ended')
        onEnded?.()
      })

      playerRef.current.on('timeupdate', async (data: any) => {
        try {
          const duration = await playerRef.current.getDuration()
          const currentTime = data.seconds
          
          // Detectar skip forward (salto hacia adelante de más de 2 segundos)
          if (currentTime > lastTime + 2 && lastTime > 0) {
            console.log('Skip detected:', lastTime, '->', currentTime)
            onSeek?.(lastTime, currentTime)
          }
          
          setLastTime(currentTime)
          onTimeUpdate?.(currentTime, duration)
        } catch (error) {
          console.error('Error in timeupdate:', error)
        }
      })

      // Detectar cuando el usuario busca manualmente en el video
      playerRef.current.on('seeked', async (data: any) => {
        try {
          const currentTime = data.seconds
          if (Math.abs(currentTime - lastTime) > 1) {
            console.log('Manual seek detected:', lastTime, '->', currentTime)
            onSeek?.(lastTime, currentTime)
          }
          setLastTime(currentTime)
        } catch (error) {
          console.error('Error in seeked:', error)
        }
      })

      playerRef.current.on('error', (error: any) => {
        console.error('Vimeo player error:', error)
      })

    } catch (error) {
      console.error('Error initializing Vimeo player:', error)
    }
  }

  return (
    <div className={`relative ${className}`} style={{ paddingBottom: '56.25%', height: 0 }}>
      <iframe
        ref={iframeRef}
        key={`vimeo-${videoId}-${key}`} // Key único para forzar re-render si es necesario
        src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        allowFullScreen
        webkitAllowFullScreen
        mozAllowFullScreen
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        title="Meditación del Autoconocimiento"
      />
    </div>
  )
})

VimeoPlayer.displayName = 'VimeoPlayer'

export default VimeoPlayer