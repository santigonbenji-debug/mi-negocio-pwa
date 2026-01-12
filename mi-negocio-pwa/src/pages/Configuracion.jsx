import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import toast from 'react-hot-toast'
import { generarBackup } from '../utils/backup'

export const Configuracion = () => {
  const { user } = useAuthStore()
  const [generando, setGenerando] = useState(false)

  const handleBackup = async () => {
    setGenerando(true)
    try {
      toast.loading('Generando backup completo...')
      const resultado = await generarBackup(user.negocio_id)
      
      toast.dismiss()
      toast.success(
        `✅ Backup descargado\n` +
        `${resultado.registros.productos} productos\n` +
        `${resultado.registros.ventas} ventas\n` +
        `${resultado.registros.cajas} cajas\n` +
        `${resultado.registros.fiados} clientes`,
        { duration: 5000 }
      )
    } catch (error) {
      toast.dismiss()
      toast.error('Error al generar backup')
      console.error(error)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-primary mb-2">⚙️ Configuración</h1>
        <p className="text-gray-600 mb-8">Gestiona tu negocio y datos</p>

        {/* Información del negocio */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Información</h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-semibold">Usuario:</span> {user?.email}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Rol:</span> {user?.rol || 'N/A'}
            </p>
          </div>
        </Card>

        {/* Backup */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">💾 Backup de Datos</h2>
          <p className="text-gray-600 mb-6">
            Descarga una copia completa de todos tus datos en formato JSON.
            Incluye productos, ventas, cajas, fiados y configuraciones.
          </p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <p className="text-yellow-800 font-semibold">⚠️ Importante:</p>
            <ul className="text-yellow-700 text-sm mt-2 space-y-1">
              <li>• Guarda el archivo en un lugar seguro</li>
              <li>• Haz backups regularmente (al menos 1 vez por semana)</li>
              <li>• El archivo contiene información sensible</li>
            </ul>
          </div>

          <Button
            variant="primary"
            onClick={handleBackup}
            disabled={generando}
            className="w-full"
          >
            {generando ? '⏳ Generando backup...' : '📥 Descargar Backup Completo'}
          </Button>
        </Card>
      </div>
    </Layout>
  )
}