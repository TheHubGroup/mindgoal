import React, { useState, useEffect } from 'react'

interface HandwritingEffectProps {
  text: string
  speed?: number
  className?: string
  onComplete?: () => void
}

const HandwritingEffect: React.FC<HandwritingEffectProps> = ({
  text,
  speed = 50,
  className = '',
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  useEffect(() => {
    setDisplayedText('')
    setCurrentIndex(0)
  }, [text])

  return (
    <span className={`${className} relative handwriting-effect`}>
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse text-blue-600">|</span>
      )}
      
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=Caveat:wght@400;500;600;700&family=Dancing+Script:wght@400;500;600;700&display=swap');
        
        .handwriting-effect {
          font-family: 'Kalam', 'Caveat', 'Dancing Script', cursive;
          font-weight: 400;
          letter-spacing: 0.8px;
          text-shadow: 0.5px 0.5px 1px rgba(0, 0, 0, 0.1);
          line-height: 1.7;
          word-spacing: 2px;
        }

        /* Efecto de tinta que se va secando */
        .handwriting-effect {
          background: linear-gradient(
            45deg,
            rgba(59, 130, 246, 0.8) 0%,
            rgba(37, 99, 235, 0.9) 50%,
            rgba(29, 78, 216, 1) 100%
          );
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          animation: inkDrying 0.5s ease-out forwards;
        }

        @keyframes inkDrying {
          0% {
            filter: blur(0.5px);
            opacity: 0.7;
          }
          100% {
            filter: blur(0px);
            opacity: 1;
          }
        }

        /* Variaciones sutiles en el texto para simular escritura a mano */
        .handwriting-effect span:nth-child(odd) {
          transform: rotate(0.3deg);
        }
        
        .handwriting-effect span:nth-child(even) {
          transform: rotate(-0.2deg);
        }
      `}</style>
    </span>
  )
}

export default HandwritingEffect