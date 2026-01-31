import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export const ScannerBarcode = ({ onScan, onClose }) => {
  const scannerRef = useRef(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [camaraActiva, setCamaraActiva] = useState(false)

  useEffect(() => {
    let html5QrCode = null
    let mounted = true

    const iniciarScanner = async () => {
      try {
        // Verificar si estamos en HTTPS o localhost
        const isSecure = window.location.protocol === 'https:' ||
                         window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1'

        if (!isSecure) {
          setError('La camara requiere conexion segura (HTTPS)')
          setCargando(false)
          return
        }

        // Crear instancia del scanner
        html5QrCode = new Html5Qrcode('reader')
        scannerRef.current = html5QrCode

        // Obtener camaras disponibles
        const devices = await Html5Qrcode.getCameras()

        if (!devices || devices.length === 0) {
          setError('No se encontraron camaras disponibles')
          setCargando(false)
          return
        }

        // Preferir camara trasera
        const camaraTrasera = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('trasera') ||
          d.label.toLowerCase().includes('rear')
        )
        const camaraId = camaraTrasera?.id || devices[0].id

        // Configuracion del scanner
        // Area grande para leer desde mas lejos (evita problemas de enfoque)
        const config = {
          fps: 15,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.5,
          disableFlip: false
        }

        // Iniciar escaneo
        await html5QrCode.start(
          camaraId,
          config,
          (decodedText) => {
            // Exito al escanear
            if (mounted) {
              html5QrCode.stop().then(() => {
                onScan(decodedText)
              }).catch(() => {
                onScan(decodedText)
              })
            }
          },
          () => {
            // Errores de escaneo (ignorar)
          }
        )

        if (mounted) {
          setCamaraActiva(true)
          setCargando(false)
        }

      } catch (err) {
        console.error('Error iniciando scanner:', err)
        if (mounted) {
          if (err.name === 'NotAllowedError') {
            setError('Permiso de camara denegado. Habilita el acceso en la configuracion del navegador.')
          } else if (err.name === 'NotFoundError') {
            setError('No se encontro ninguna camara en el dispositivo.')
          } else if (err.name === 'NotReadableError') {
            setError('La camara esta siendo usada por otra aplicacion.')
          } else {
            setError('Error al acceder a la camara: ' + (err.message || 'Error desconocido'))
          }
          setCargando(false)
        }
      }
    }

    iniciarScanner()

    // Cleanup
    return () => {
      mounted = false
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [onScan])

  const handleCerrar = () => {
    if (scannerRef.current && camaraActiva) {
      scannerRef.current.stop().then(() => {
        onClose()
      }).catch(() => {
        onClose()
      })
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-bold text-lg dark:text-white">
            {cargando ? 'Iniciando camara...' : 'Escaneando Codigo...'}
          </h3>
          <button
            onClick={handleCerrar}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Scanner o Error */}
        {error ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">📷</div>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={handleCerrar}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* Loading */}
            {cargando && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Solicitando acceso a la camara...</p>
              </div>
            )}

            {/* Contenedor del scanner */}
            <div id="reader" className={`w-full ${cargando ? 'hidden' : ''}`}></div>

            {/* Instrucciones */}
            {!cargando && (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Apunta la camara al codigo de barras del producto.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
