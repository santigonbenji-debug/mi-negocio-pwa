import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

export const ScannerBarcode = ({ onScan, onClose }) => {
  const scannerRef = useRef(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let mounted = true
    let timeoutId = null

    const iniciarScanner = async () => {
      try {
        timeoutId = setTimeout(() => {
          if (mounted && cargando) {
            setError('La camara tarda demasiado. Intenta cerrar y abrir de nuevo.')
            setCargando(false)
          }
        }, 15000)

        // Todos los formatos de codigo de barras
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX
        ]

        const html5QrCode = new Html5Qrcode('reader', {
          formatsToSupport,
          verbose: false
        })
        scannerRef.current = html5QrCode

        // Sin qrbox = escanea TODA la pantalla visible
        const config = {
          fps: 30,
          disableFlip: true,  // NO voltear la imagen (importante para codigos de barras)
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (mounted) {
              // Vibrar para feedback tactil
              if (navigator.vibrate) {
                navigator.vibrate(100)
              }

              html5QrCode.stop().then(() => {
                onScan(decodedText)
              }).catch(() => {
                onScan(decodedText)
              })
            }
          },
          () => {}
        )

        if (timeoutId) clearTimeout(timeoutId)
        if (mounted) setCargando(false)

      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId)
        console.error('Error scanner:', err)

        if (mounted) {
          if (err.toString().includes('NotAllowedError') || err.toString().includes('Permission')) {
            setError('Permiso denegado. Permite el acceso a la camara en configuracion.')
          } else if (err.toString().includes('NotFoundError')) {
            setError('No se encontro camara.')
          } else if (err.toString().includes('NotReadableError') || err.toString().includes('TrackStartError')) {
            setError('Camara en uso por otra app.')
          } else if (err.toString().includes('OverconstrainedError')) {
            // Intentar camara frontal
            try {
              const formatsToSupport = [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.QR_CODE
              ]
              const html5QrCode = new Html5Qrcode('reader', { formatsToSupport, verbose: false })
              scannerRef.current = html5QrCode
              await html5QrCode.start(
                { facingMode: "user" },
                { fps: 30, disableFlip: true },
                (decodedText) => {
                  if (mounted) {
                    if (navigator.vibrate) navigator.vibrate(100)
                    html5QrCode.stop().then(() => onScan(decodedText)).catch(() => onScan(decodedText))
                  }
                },
                () => {}
              )
              if (mounted) setCargando(false)
              return
            } catch {
              setError('No se pudo acceder a la camara.')
            }
          } else {
            setError('Error: ' + (err.message || err.toString()))
          }
          setCargando(false)
        }
      }
    }

    iniciarScanner()

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {})
        } catch {}
      }
    }
  }, [])

  const handleCerrar = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {}
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 flex justify-between items-center">
        <h3 className="font-bold text-lg text-white">
          {cargando ? 'Abriendo camara...' : 'Apunta al codigo'}
        </h3>
        <button
          onClick={handleCerrar}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-white text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 relative">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-red-400 mb-6 text-lg">{error}</p>
              <button
                onClick={handleCerrar}
                className="px-8 py-3 bg-white text-black rounded-xl font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            {cargando && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-4"></div>
                  <p className="text-white text-lg">Iniciando camara...</p>
                </div>
              </div>
            )}

            {/* Scanner - pantalla completa */}
            <div id="reader" className="w-full h-full"></div>

            {/* Guia visual - linea central */}
            {!cargando && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4/5 max-w-sm">
                  <div className="border-2 border-green-400 rounded-lg h-24 flex items-center justify-center bg-green-400/10">
                    <div className="w-full h-0.5 bg-green-400 animate-pulse"></div>
                  </div>
                  <p className="text-center text-white/80 mt-4 text-sm">
                    Coloca el codigo de barras dentro del recuadro
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
