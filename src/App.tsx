import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import TimelineActivity from './pages/TimelineActivity'
import CuentameQuienEres from './pages/CuentameQuienEres'
import CartaMiMismo from './pages/CartaMiMismo'
import MeditacionAutoconocimiento from './pages/MeditacionAutoconocimiento'
import UserBarPage from './pages/UserBarPage'
import StandaloneUserBar from './pages/StandaloneUserBar'
import StandaloneLoginUserBar from './pages/StandaloneLoginUserBar'

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
            <Route path="/actividad/linea-tiempo" element={
              <ProtectedRoute>
                <TimelineActivity />
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
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App