import React, { useState } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

export const EmailVerificationPending = ({ email, onLogout }) => {
  const [reenviando, setReenviando] = useState(false)

  const handleReenviar = async () => {
    setReenviando(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) throw error
      toast.success('Email de verificacion reenviado. Revisa tu bandeja de entrada.')
    } catch (error) {
      toast.error('Error al reenviar email. Intenta mas tarde.')
    } finally {
      setReenviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center">
          {/* Icono */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">📧</span>
            </div>
          </div>

          {/* Titulo */}
          <h1 className="text-2xl font-bold mb-3">
            Verifica tu email
          </h1>

          {/* Mensaje */}
          <div className="space-y-3 text-gray-600 mb-6">
            <p>
              Hemos enviado un email de verificacion a:
            </p>
            <p className="font-semibold text-gray-800">
              {email}
            </p>
            <p>
              Haz click en el enlace del email para activar tu cuenta y comenzar a usar el sistema.
            </p>
          </div>

          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800 mb-2">
              <strong>No ves el email?</strong>
            </p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Revisa tu carpeta de spam o correo no deseado</li>
              <li>El email puede tardar algunos minutos en llegar</li>
              <li>Verifica que la direccion sea correcta</li>
            </ul>
          </div>

          {/* Acciones */}
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleReenviar}
              disabled={reenviando}
            >
              {reenviando ? 'Reenviando...' : 'Reenviar email de verificacion'}
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={onLogout}
            >
              Cerrar sesion
            </Button>
          </div>

          {/* Ayuda */}
          <p className="text-sm text-gray-500 mt-6">
            Problemas? Contacta a soporte
          </p>
        </div>
      </Card>
    </div>
  )
}
