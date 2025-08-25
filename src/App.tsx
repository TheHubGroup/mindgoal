import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import TimelineActivity from './pages/TimelineActivity'
import TimelineActivityV2 from './pages/TimelineActivityV2'
import CuentameQuienEres from './pages/CuentameQuienEres'
import CartaMiMismo from './pages/CartaMiMismo'
import MeditacionAutoconocimiento from './pages/MeditacionAutoconocimiento'
import NombraTusEmociones from './pages/NombraTusEmociones'
import EmotionCalculatorPage from './pages/EmotionCalculatorPage'
import MenuDeLaIra from './pages/MenuDeLaIra'
import UserBarPage from './pages/UserBarPage'
import DashboardPage from './pages/DashboardPage'
import StandaloneUserBar from './pages/StandaloneUserBar'
import StandaloneLoginUserBar from './pages/StandaloneLoginUserBar'
import StandaloneEmotionCalculator from './pages/StandaloneEmotionCalculator'
import LeaderboardPage from './pages/LeaderboardPage'
import UserDetailPage from './pages/UserDetailPage'
import LaComunicacion from './pages/LaComunicacion'
import SemaforoLimites from './pages/SemaforoLimites'

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />
}

// Public Route Component (redirect to home if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return user ? <Navigate to="/" /> : <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            } />
            <Route path="/user/:userId" element={
              <ProtectedRoute>
                <UserDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/actividad/linea-tiempo" element={
              <ProtectedRoute>
                <TimelineActivity />
              </ProtectedRoute>
            } />
            <Route path="/actividad/linea-tiempo-v2" element={
              <ProtectedRoute>
                <TimelineActivityV2 />
              </ProtectedRoute>
            } />
            <Route path="/actividad/cuentame-quien-eres" element={
              <ProtectedRoute>
                <CuentameQuienEres />
              </ProtectedRoute>
            } />
            <Route path="/actividad/carta-mi-mismo" element={
              <ProtectedRoute>
                <CartaMiMismo />
              </ProtectedRoute>
            } />
            <Route path="/actividad/meditacion-autoconocimiento" element={
              <ProtectedRoute>
                <MeditacionAutoconocimiento />
              </ProtectedRoute>
            } />
            <Route path="/actividad/nombra-tus-emociones" element={
              <ProtectedRoute>
                <NombraTusEmociones />
              </ProtectedRoute>
            } />
            <Route path="/actividad/calculadora-emociones" element={
              <ProtectedRoute>
                <EmotionCalculatorPage />
              </ProtectedRoute>
            } />
            <Route path="/actividad/menu-de-la-ira" element={
              <ProtectedRoute>
                <MenuDeLaIra />
              </ProtectedRoute>
            } />
            <Route path="/actividad/la-comunicacion" element={
              <ProtectedRoute>
                <LaComunicacion />
              </ProtectedRoute>
            } />
            <Route path="/actividad/semaforo-limites" element={
              <ProtectedRoute>
                <SemaforoLimites />
              </ProtectedRoute>
            } />
            <Route path="/user-bar" element={
              <ProtectedRoute>
                <UserBarPage />
              </ProtectedRoute>
            } />
            <Route path="/standalone-user-bar" element={
              <ProtectedRoute>
                <StandaloneUserBar />
              </ProtectedRoute>
            } />
            <Route path="/standalone-login-bar" element={
              <StandaloneLoginUserBar />
            } />
            <Route path="/standalone-emotion-calculator" element={
              <StandaloneEmotionCalculator />
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App