import React, { useState, useEffect, useCallback } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { useVentasStore } from '../../store/ventasStore'
import { useProductosStore } from '../../store/productosStore'
import { useLaserScanner } from '../../hooks/useLaserScanner'
import { useAuthStore } from '../../store/authStore'
import { useCajaStore } from '../../store/cajaStore'
import toast from 'react-hot-toast'

export const ScannerSalesModal = ({ isOpen, onClose }) => {
    const { user } = useAuthStore()
    const { cajaActual } = useCajaStore()
    const { productos } = useProductosStore()
    const {
        carrito,
        agregarAlCarrito,
        procesarVenta,
        calcularTotal,
        vaciarCarrito,
        actualizarCantidad,
        quitarDelCarrito
    } = useVentasStore()

    const [ultimoProducto, setUltimoProducto] = useState(null)
    const [procesando, setProcesando] = useState(false)
    const [lastScanTime, setLastScanTime] = useState(0)

    const total = calcularTotal()

    const handleScan = useCallback((codigo) => {
        const producto = productos.find(p => p.codigo_barras === codigo)

        if (producto) {
            if (producto.stock_actual <= 0 && !producto.es_por_kg) {
                toast.error(`Sin stock: ${producto.nombre}`)
                return
            }

            // Los productos por KG suelen requerir balanza, pero aquí los agregamos por defecto 
            // o podrías abrir un modal extra. Por ahora, para "escanear y vender", 
            // asumimos 1 unidad o 1kg si es por KG (o podrías manejarlo distinto).
            // Usuario pidió: "Solo escaneamos, se agrega al producto al carrito"
            agregarAlCarrito(producto, 1)
            setUltimoProducto(producto)
            setLastScanTime(Date.now())
            toast.success(`${producto.nombre} agregado`)
        } else {
            toast.error(`Código no encontrado: ${codigo}`)
        }
    }, [productos, agregarAlCarrito])

    // Usar el hook del láser
    useLaserScanner(handleScan)

    const handleVender = async () => {
        if (carrito.length === 0) return
        if (procesando) return

        setProcesando(true)
        try {
            await procesarVenta(
                user.negocio_id,
                user.id,
                cajaActual.id,
                'efectivo', // Por defecto efectivo para venta rápida por escáner
                null
            )
            toast.success('✅ Venta realizada correctamente')
            setUltimoProducto(null)
        } catch (error) {
            toast.error(error.message)
        } finally {
            setProcesando(false)
        }
    }

    // Manejar tecla Enter para vender
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return

            if (e.key === 'Enter') {
                // Solo vender si NO hubo un escaneo reciente (prevención de doble disparo)
                // Las lectoras envían Enter inmediatamente después del código.
                const timeSinceScan = Date.now() - lastScanTime
                if (timeSinceScan > 500 && carrito.length > 0) {
                    handleVender()
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, carrito, lastScanTime, handleVender])

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="🚀 VENTAS POR ESCANER"
            maxWidth="max-w-3xl"
        >
            <div className="flex flex-col gap-6">
                {/* Banner de Feedback de Escaneo */}
                <div className={`
          p-6 rounded-2xl border-2 transition-all text-center
          ${ultimoProducto
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                    }
        `}>
                    {ultimoProducto ? (
                        <div className="animate-in fade-in zoom-in duration-300">
                            <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Último producto escaneado</p>
                            <h3 className="text-3xl font-black text-gray-800 dark:text-white uppercase">{ultimoProducto.nombre}</h3>
                            <p className="text-4xl font-black text-primary mt-2">${ultimoProducto.precio.toFixed(2)}</p>
                        </div>
                    ) : (
                        <div className="py-4">
                            <div className="text-5xl mb-3">📡</div>
                            <p className="text-xl font-bold text-gray-500 dark:text-gray-400 uppercase">Esperando escaneo...</p>
                            <p className="text-xs text-gray-400 mt-2 italic">Apunta el láser al código de barras del producto</p>
                        </div>
                    )}
                </div>

                {/* Listado del Carrito */}
                <div className="flex-1 max-h-[40vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-gray-800 dark:text-white uppercase italic">Lista de Venta ({carrito.length})</h4>
                        {carrito.length > 0 && (
                            <button
                                onClick={vaciarCarrito}
                                className="text-xs font-bold text-red-500 hover:underline uppercase"
                            >
                                Vaciar todo
                            </button>
                        )}
                    </div>

                    {carrito.length === 0 ? (
                        <div className="text-center py-10 opacity-20 border-2 border-dashed rounded-2xl">
                            <p className="text-4xl mb-2">🛒</p>
                            <p className="font-black uppercase text-sm">Carrito vacío</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {[...carrito].reverse().map((item, index) => {
                                // Revertir el index para que coincida con el store si es necesario, 
                                // o usar una referencia única. El map del store usa el index real.
                                // Aquí invertimos visualmente para mostrar lo último arriba.
                                const realIndex = carrito.length - 1 - index;
                                return (
                                    <div key={realIndex} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-gray-800 dark:text-white truncate uppercase text-sm">{item.nombre}</p>
                                            <p className="text-xs text-gray-500 font-bold">
                                                {item.cantidad} x ${item.precio_unitario}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => actualizarCantidad(realIndex, item.cantidad - 1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg text-lg font-black"
                                                >-</button>
                                                <span className="w-8 text-center font-black text-sm">{item.cantidad}</span>
                                                <button
                                                    onClick={() => actualizarCantidad(realIndex, item.cantidad + 1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg text-lg font-black"
                                                >+</button>
                                            </div>
                                            <button
                                                onClick={() => quitarDelCarrito(realIndex)}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer con Total y Botón de Venta */}
                <div className="border-t dark:border-gray-700 pt-6 mt-2">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total acumulado</p>
                            <h3 className="text-4xl font-black text-primary">${total.toFixed(2)}</h3>
                        </div>
                        <div className="text-right">
                            <Badge variant="primary" className="py-2 px-4 text-base">EFECTIVO</Badge>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold italic">Presiona ENTER para vender</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="secondary"
                            className="py-4 font-bold uppercase tracking-widest"
                            onClick={onClose}
                        >
                            Cerrar
                        </Button>
                        <Button
                            variant="primary"
                            className="py-4 text-xl font-black uppercase tracking-tighter rounded-2xl shadow-xl shadow-primary/20"
                            onClick={handleVender}
                            disabled={carrito.length === 0 || procesando}
                        >
                            {procesando ? '⏳ ...' : 'VENDER (ENTER)'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
