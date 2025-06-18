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

export interface VimeoPlayerRef {
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
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [lastTime, setLastTime] = useState(0)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  // Exponer métodos públicos a través de ref
  useImperativeHandle(ref, () => ({
    restart: async () => {
      console.log('🔄 Restart method called')
      if (playerRef.current && isPlayerReady) {
        try {
          await playerRef.current.setCurrentTime(0)
          setLastTime(0)
          console.log('✅ Video restarted to position 0')
        } catch (error) {
          console.error('❌ Error restarting video:', error)
        }
      } else {
        console.warn('⚠️ Player not ready for restart')
      }
    },
    getCurrentTime: async () => {
      if (playerRef.current && isPlayerReady) {
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
      if (playerRef.current && isPlayerReady) {
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
      if (playerRef.current && isPlayerReady) {
        try {
          await playerRef.current.play()
        } catch (error) {
          console.error('Error playing video:', error)
        }
      }
    },
    pause: async () => {
      if (playerRef.current && isPlayerReady) {
        try {
          await playerRef.current.pause()
        } catch (error) {
          console.error('Error pausing video:', error)
        }
      }
    }
  }), [isPlayerReady])

  // Cargar script de Vimeo
  useEffect(() => {
    const loadVimeoScript = () => {
      if (window.Vimeo) {
        setIsScriptLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://player.vimeo.com/api/player.js'
      script.onload = () => {
        console.log('📜 Vimeo script loaded')
        setIsScriptLoaded(true)
      }
      script.onerror = () => {
        console.error('❌ Failed to load Vimeo script')
      }
      document.head.appendChild(script)
    }

    loadVimeoScript()
  }, [])

  // Inicializar player cuando el script esté cargado
  useEffect(() => {
    if (isScriptLoaded && containerRef.current && !playerRef.current) {
      initializePlayer()
    }

    return () => {
      if (playerRef.current) {
        try {
          console.log('🧹 Cleaning up Vimeo player')
          playerRef.current.destroy()
          playerRef.current = null
          setIsPlayerReady(false)
        } catch (error) {
          console.error('Error destroying player:', error)
        }
      }
    }
  }, [isScriptLoaded, videoId])

  const initializePlayer = () => {
    if (!containerRef.current || !window.Vimeo) {
      console.warn('⚠️ Cannot create player: missing container or Vimeo')
      return
    }

    try {
      console.log('🎯 Creating Vimeo player instance')
      
      // Limpiar contenedor
      containerRef.current.innerHTML = ''
      
      // Crear iframe manualmente
      const iframe = document.createElement('iframe')
      iframe.src = `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=vimeo-player-${videoId}`
      iframe.width = '100%'
      iframe.height = '100%'
      iframe.frameBorder = '0'
      iframe.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share'
      iframe.allowFullscreen = true
      iframe.style.position = 'absolute'
      iframe.style.top = '0'
      iframe.style.left = '0'
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      
      containerRef.current.appendChild(iframe)

      // Crear player con el iframe
      playerRef.current = new window.Vimeo.Player(iframe)

      // Configurar eventos
      playerRef.current.on('loaded', async () => {
        console.log('✅ Player loaded successfully')
        setIsPlayerReady(true)
        try {
          const duration = await playerRef.current.getDuration()
          console.log('⏱️ Video duration:', duration)
          onReady?.(duration)
        } catch (error) {
          console.error('Error getting duration:', error)
        }
      })

      playerRef.current.on('play', () => {
        console.log('▶️ Video playing')
        onPlay?.()
      })

      playerRef.current.on('pause', () => {
        console.log('⏸️ Video paused')
        onPause?.()
      })

      playerRef.current.on('ended', () => {
        console.log('🏁 Video ended')
        onEnded?.()
      })

      playerRef.current.on('timeupdate', async (data: any) => {
        try {
          const duration = await playerRef.current.getDuration()
          const currentTime = data.seconds
          
          // Detectar skip forward (salto hacia adelante de más de 2 segundos)
          if (currentTime > lastTime + 2 && lastTime > 0) {
            console.log('⏭️ Skip detected:', lastTime, '->', currentTime)
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
            console.log('🎯 Manual seek detected:', lastTime, '->', currentTime)
            onSeek?.(lastTime, currentTime)
          }
          setLastTime(currentTime)
        } catch (error) {
          console.error('Error in seeked:', error)
        }
      })

      playerRef.current.on('error', (error: any) => {
        console.error('❌ Vimeo player error:', error)
      })

    } catch (error) {
      console.error('❌ Error creating Vimeo player:', error)
    }
  }

  return (
    <div className={`relative ${className}`} style={{ paddingBottom: '56.25%', height: 0 }}>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#000'
        }}
      />
      
      {/* Loading indicator */}
      {!isPlayerReady && (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 10
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px'
            }} />
            Cargando video...
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})

VimeoPlayer.displayName = 'VimeoPlayer'

export default VimeoPlayer