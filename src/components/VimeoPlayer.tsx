import React, { useEffect, useRef, useState } from 'react'

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

declare global {
  interface Window {
    Vimeo: any
  }
}

const VimeoPlayer: React.FC<VimeoPlayerProps> = ({
  videoId,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onReady,
  onSeek,
  className = ''
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<any>(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [lastTime, setLastTime] = useState(0)

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
      if (playerRef.current) {
        playerRef.current.destroy()
      }
    }
  }, [videoId])

  const initializePlayer = () => {
    if (!iframeRef.current || !window.Vimeo) return

    try {
      playerRef.current = new window.Vimeo.Player(iframeRef.current)

      // Configurar eventos
      playerRef.current.on('loaded', async () => {
        setIsPlayerReady(true)
        try {
          const duration = await playerRef.current.getDuration()
          onReady?.(duration)
        } catch (error) {
          console.error('Error getting duration:', error)
        }
      })

      playerRef.current.on('play', () => {
        onPlay?.()
      })

      playerRef.current.on('pause', () => {
        onPause?.()
      })

      playerRef.current.on('ended', () => {
        onEnded?.()
      })

      playerRef.current.on('timeupdate', async (data: any) => {
        try {
          const duration = await playerRef.current.getDuration()
          const currentTime = data.seconds
          
          // Detectar skip forward (salto hacia adelante de más de 2 segundos)
          if (currentTime > lastTime + 2 && lastTime > 0) {
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
            onSeek?.(lastTime, currentTime)
          }
          setLastTime(currentTime)
        } catch (error) {
          console.error('Error in seeked:', error)
        }
      })

    } catch (error) {
      console.error('Error initializing Vimeo player:', error)
    }
  }

  // Método público para reiniciar el video
  const restart = async () => {
    if (playerRef.current) {
      try {
        await playerRef.current.setCurrentTime(0)
        setLastTime(0)
      } catch (error) {
        console.error('Error restarting video:', error)
      }
    }
  }

  // Exponer el método restart
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.restart = restart
    }
  }, [isPlayerReady])

  return (
    <div className={`relative ${className}`} style={{ paddingBottom: '56.25%', height: 0 }}>
      <iframe
        ref={iframeRef}
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
}

export default VimeoPlayer