// ============================================
// ¿QUÉ HACE ESTO?
// Página para crear cuenta nueva
//
// ANALOGÍA:
// Como hacer una copia de llave para un nuevo empleado
// o registrar un nuevo negocio en el sistema
// ============================================

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Card } from '../components/common/Card'
import toast from 'react-hot-toast'

export const Registro = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(false)
  const registro = useAuthStore(state => state.registro)
  const navigate = useNavigate()

  const handleRegistro = async (e) => {
    e.preventDefault()
    
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    setCargando(true)
    try {
      await registro(email, password, nombre)
      toast.success('¡Cuenta creada! Revisa tu email para confirmar')
      navigate('/login')
    } catch (error) {
      toast.error('Error al crear cuenta. Intenta con otro email')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-primary mb-2">
            📝 Crear Cuenta
          </h1>
          <p className="text-gray-600">Registra tu negocio</p>
        </div>
        
        <form onSubmit={handleRegistro} className="space-y-4">
          <Input
            label="Nombre completo"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Juan Pérez"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
          <Input
            label="Contraseña (mínimo 6 caracteres)"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Button type="submit" className="w-full" disabled={cargando}>
            {cargando ? 'Creando cuenta...' : 'Registrarse'}
          </Button>
        </form>
        
        <p className="text-center mt-6 text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-primary font-semibold hover:underline"
          >
            Inicia sesión
          </button>
        </p>
      </Card>
    </div>
  )
}