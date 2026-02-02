import React, { useEffect, useRef, useState, useCallback } from 'react'
import Quagga from '@ericblade/quagga2'

export const ScannerBarcode = ({ onScan, onClose }) => {
  const scannerRef = useRef(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [lastCode, setLastCode] = useState(null)

  const handleDetected = useCallback((result) => {
    const code = result.codeResult.code

    // Evitar detecciones duplicadas
    if (code && code !== lastCode) {
      setLastCode(code)

      // Vibrar para feedback táctil
      if (navigator.vibrate) {
        navigator.vibrate(200)
      }

      // Detener el escáner y llamar callback
      Quagga.stop()
      onScan(code)
    }
  }, [lastCode, onScan])

  useEffect(() => {
    let mounted = true

    const iniciarScanner = async () => {
      try {
        // Verificar permisos de cámara
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        stream.getTracks().forEach(track => track.stop())

        if (!mounted) return

        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              facingMode: "environment",
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              aspectRatio: { min: 1, max: 2 }
            },
            area: {
              // Área de escaneo: región central
              top: "20%",
              right: "10%",
              left: "10%",
              bottom: "20%"
            }
          },
          locator: {
            patchSize: "medium",  // "small", "medium", "large", "x-large"
            halfSample: true
          },
          numOfWorkers: navigator.hardwareConcurrency || 4,
          frequency: 10,  // Intentos por segundo
          decoder: {
            readers: [
              "ean_reader",        // EAN-13 y EAN-8
              "ean_8_reader",
              "upc_reader",        // UPC-A
              "upc_e_reader",      // UPC-E
              "code_128_reader",
              "code_39_reader",
              "codabar_reader"
            ],
            multiple: false
          },
          locate: true
        }, (err) => {
          if (err) {
            console.error('Error Quagga init:', err)
            if (mounted) {
              if (err.name === 'NotAllowedError') {
                setError('Permiso denegado. Permite el acceso a la cámara.')
              } else if (err.name === 'NotFoundError') {
                setError('No se encontró cámara.')
              } else {
                setError('Error al iniciar cámara: ' + err.message)
              }
              setCargando(false)
            }
            return
          }

          if (mounted) {
            Quagga.start()
            setCargando(false)
          }
        })

        Quagga.onDetected(handleDetected)

        // También escuchar cuando procesa (para depuración)
        Quagga.onProcessed((result) => {
          const drawingCtx = Quagga.canvas.ctx.overlay
          const drawingCanvas = Quagga.canvas.dom.overlay

          if (result) {
            if (result.boxes) {
              drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
              result.boxes.filter(box => box !== result.box).forEach(box => {
                Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 })
              })
            }

            if (result.box) {
              Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 })
            }

            if (result.codeResult && result.codeResult.code) {
              Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 })
            }
          }
        })

      } catch (err) {
        console.error('Error scanner:', err)
        if (mounted) {
          if (err.name === 'NotAllowedError') {
            setError('Permiso denegado. Permite el acceso a la cámara en configuración.')
          } else if (err.name === 'NotFoundError') {
            setError('No se encontró cámara.')
          } else if (err.name === 'NotReadableError') {
            setError('Cámara en uso por otra app.')
          } else {
            setError('Error: ' + err.message)
          }
          setCargando(false)
        }
      }
    }

    iniciarScanner()

    return () => {
      mounted = false
      Quagga.offDetected(handleDetected)
      Quagga.stop()
    }
  }, [handleDetected])

  const handleCerrar = () => {
    Quagga.offDetected(handleDetected)
    Quagga.stop()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 flex justify-between items-center">
        <h3 className="font-bold text-lg text-white">
          {cargando ? 'Abriendo cámara...' : 'Apunta al código'}
        </h3>
        <button
          onClick={handleCerrar}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-white text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 relative overflow-hidden">
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
                  <p className="text-white text-lg">Iniciando cámara...</p>
                </div>
              </div>
            )}

            {/* Scanner container - Quagga inserta el video aquí */}
            <div
              ref={scannerRef}
              className="w-full h-full"
              style={{ position: 'relative' }}
            >
              {/* Quagga insertará el <video> y <canvas> aquí */}
            </div>

            {/* Guía visual - línea central */}
            {!cargando && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4/5 max-w-md">
                  <div className="border-2 border-green-400 rounded-lg h-32 flex items-center justify-center bg-green-400/10">
                    <div className="w-full h-1 bg-green-400 animate-pulse"></div>
                  </div>
                  <p className="text-center text-white/80 mt-4 text-sm">
                    Centra el código de barras en el recuadro
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Estilos para el video de Quagga */}
      <style>{`
        #scannerRef video, 
        .drawingBuffer {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        .drawingBuffer {
          position: absolute;
          top: 0;
          left: 0;
        }
      `}</style>
    </div>
  )
}
