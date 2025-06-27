import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { leaderboardService, LeaderboardUser } from '../lib/leaderboardService'

export const useLeaderboard = () => {
  const { user } = useAuth()
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([])
  const [currentUserPosition, setCurrentUserPosition] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadLeaderboard()
  }, [user])

  const loadLeaderboard = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Cargar todos los puntajes públicos
      const users = await leaderboardService.getAllPublicScores()
      setLeaderboardUsers(users)
      
      // Encontrar posición del usuario actual
      if (user) {
        const currentUser = users.find(u => u.id === user.id)
        setCurrentUserPosition(currentUser?.position || null)
      }
      
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error loading leaderboard:', err)
      setError('Error al cargar el leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const updateCurrentUserScore = async () => {
    if (!user) return
    
    setIsUpdating(true)
    try {
      // Calcular el puntaje actual del usuario
      const score = await leaderboardService.calculateUserScore(user.id)
      
      // Actualizar el puntaje en la tabla pública
      await leaderboardService.updatePublicScore(user.id, score)
      
      // Recargar el leaderboard para ver los cambios
      await loadLeaderboard()
    } catch (err) {
      console.error('Error updating user score:', err)
      setError('Error al actualizar tu puntaje')
    } finally {
      setIsUpdating(false)
    }
  }

  const updateAllScores = async () => {
    setIsUpdating(true)
    try {
      await leaderboardService.updateAllPublicScores()
      await loadLeaderboard()
    } catch (err) {
      console.error('Error updating all scores:', err)
      setError('Error al actualizar todos los puntajes')
    } finally {
      setIsUpdating(false)
    }
  }

  return {
    leaderboardUsers,
    currentUserPosition,
    loading,
    error,
    lastUpdated,
    isUpdating,
    loadLeaderboard,
    updateCurrentUserScore,
    updateAllScores
  }
}