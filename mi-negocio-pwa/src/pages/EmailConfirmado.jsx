import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'

export const EmailConfirmado = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Auto-redirigir despues de 5 segundos
    const timer = setTimeout(() => {
      navigate('/login')
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        {/* Icono de exito */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-5xl">✅</span>
          </div>
        </div>

        {/* Titulo */}
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Email Verificado!
        </h1>

        {/* Mensaje */}
        <p className="text-gray-600 mb-6">
          Tu cuenta ha sido verificada exitosamente.
          <br />
          Ya puedes iniciar sesion y comenzar a usar el sistema.
        </p>

        {/* Boton */}
        <Button
          variant="primary"
          className="w-full"
          onClick={() => navigate('/login')}
        >
          Ir a Iniciar Sesion
        </Button>

        {/* Contador */}
        <p className="text-sm text-gray-500 mt-4">
          Seras redirigido automaticamente en 5 segundos...
        </p>
      </Card>
    </div>
  )
}
