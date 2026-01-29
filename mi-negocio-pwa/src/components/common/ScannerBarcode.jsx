import React, { useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

export const ScannerBarcode = ({ onScan, onClose }) => {
    const scannerRef = useRef(null)

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            'reader',
            {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                rememberLastUsedCamera: true
            },
      /* verbose= */ false
        )

        scanner.render(
            (decodedText) => {
                // Al escanear con éxito
                scanner.clear().then(() => {
                    onScan(decodedText)
                }).catch(err => {
                    console.error("Error clearing scanner", err)
                    onScan(decodedText)
                })
            },
            (error) => {
                // Errores de escaneo (ignorar usualmente para no saturar consola)
            }
        )

        return () => {
            scanner.clear().catch(err => console.error("Error stopping scanner on unmount", err))
        }
    }, [])

    return (
        <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-lg dark:text-white">Escaneando Código...</h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-2xl"
                    >
                        ✕
                    </button>
                </div>

                <div id="reader" className="w-full"></div>

                <div className="p-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Apunta la cámara al código de barras del producto.
                    </p>
                </div>
            </div>
        </div>
    )
}
