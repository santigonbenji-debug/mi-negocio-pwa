import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export const ScannerBarcode = ({ onScan, onClose }) => {
  const scannerRef = useRef(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let mounted = true
    let timeoutId = null

    const iniciarScanner = async () => {
      try {
        // Timeout de seguridad - si no inicia en 10 segundos, mostrar error
        timeoutId = setTimeout(() => {
          if (mounted && cargando) {
            setError('La camara tarda demasiado en iniciar. Intenta cerrar y abrir de nuevo.')
            setCargando(false)
          }
        }, 10000)

        // Crear instancia del scanner
        const html5QrCode = new Html5Qrcode('reader')
        scannerRef.current = html5QrCode

        // Configuracion - usar facingMode en lugar de deviceId (mas compatible con iOS)
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 100 },
          aspectRatio: 1.777778
        }

        // Iniciar con camara trasera usando facingMode (mejor compatibilidad)
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (mounted) {
              // Detener scanner y llamar callback
              html5QrCode.stop().then(() => {
                onScan(decodedText)
              }).catch(() => {
                onScan(decodedText)
              })
            }
          },
          () => {
            // Errores de escaneo (frames sin codigo) - ignorar
          }
        )

        // Exito - limpiar timeout y actualizar estado
        if (timeoutId) clearTimeout(timeoutId)
        if (mounted) {
          setCargando(false)
        }

      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId)
        console.error('Error scanner:', err)

        if (mounted) {
          // Mensajes de error amigables
          if (err.toString().includes('NotAllowedError') || err.toString().includes('Permission')) {
            setError('Permiso de camara denegado. Ve a Configuracion > Safari > Camara y permite el acceso.')
          } else if (err.toString().includes('NotFoundError')) {
            setError('No se encontro camara en el dispositivo.')
          } else if (err.toString().includes('NotReadableError') || err.toString().includes('TrackStartError')) {
            setError('La camara esta en uso por otra app. Cierra otras apps y reintenta.')
          } else if (err.toString().includes('OverconstrainedError')) {
            // Intentar con camara frontal si la trasera falla
            try {
              const html5QrCode = new Html5Qrcode('reader')
              scannerRef.current = html5QrCode
              await html5QrCode.start(
                { facingMode: "user" },
                { fps: 10, qrbox: { width: 250, height: 100 } },
                (decodedText) => {
                  if (mounted) {
                    html5QrCode.stop().then(() => onScan(decodedText)).catch(() => onScan(decodedText))
                  }
                },
                () => {}
              )
              if (mounted) setCargando(false)
              return
            } catch {
              setError('No se pudo acceder a ninguna camara.')
            }
          } else {
            setError('Error al iniciar camara: ' + (err.message || err.toString()))
          }
          setCargando(false)
        }
      }
    }

    iniciarScanner()

    // Cleanup
    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {})
        } catch {
          // Ignorar errores de cleanup
        }
      }
    }
  }, [])

  const handleCerrar = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {
        // Ignorar
      }
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="bg-black/80 p-4 flex justify-between items-center">
        <h3 className="font-bold text-lg text-white">
          {cargando ? 'Iniciando camara...' : 'Escanea el codigo'}
        </h3>
        <button
          onClick={handleCerrar}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {error ? (
          <div className="p-8 text-center max-w-sm">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-red-400 mb-6 text-lg">{error}</p>
            <button
              onClick={handleCerrar}
              className="px-8 py-3 bg-white text-black rounded-xl font-semibold"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {cargando && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-4"></div>
                  <p className="text-white text-lg">Abriendo camara...</p>
                </div>
              </div>
            )}

            {/* Scanner container - siempre visible */}
            <div id="reader" className="w-full max-w-lg"></div>
          </>
        )}
      </div>

      {/* Instrucciones */}
      {!error && !cargando && (
        <div className="bg-black/80 p-6 text-center">
          <p className="text-white/80">
            Apunta al codigo de barras
          </p>
        </div>
      )}
    </div>
  )
}
