import React, { useMemo, useState } from 'react'
import { Modal } from '../common/Modal'
import { Badge } from '../common/Badge'
import { Input } from '../common/Input'

export const DetalleGananciaModal = ({ isOpen, onClose, datos, gastos, mesStr }) => {
    const [busqueda, setBusqueda] = useState('')

    // Filtrar productos
    const productosFiltrados = useMemo(() => {
        if (!busqueda) return datos
        return datos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    }, [datos, busqueda])

    const totales = useMemo(() => {
        return datos.reduce((acc, curr) => ({
            ingresos: acc.ingresos + curr.ingresos,
            costos: acc.costos + curr.costos,
            ganancia: acc.ganancia + curr.ganancia
        }), { ingresos: 0, costos: 0, ganancia: 0 })
    }, [datos])

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Detalle de Ganancias - ${mesStr}`}
            maxWidth="max-w-3xl"
        >
            <div className="space-y-6">
                {/* Resumen Superior */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                        <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Total Ingresos</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-300">${totales.ingresos.toFixed(2)}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Total Costos</p>
                        <p className="text-xl font-bold text-orange-700 dark:text-orange-300">${totales.costos.toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Ganancia Bruta</p>
                        <p className="text-xl font-bold text-purple-700 dark:text-purple-300">${totales.ganancia.toFixed(2)}</p>
                    </div>
                </div>

                {/* Ganancia Real (Limpia) */}
                {gastos > 0 && (
                    <div className="bg-primary/10 p-6 rounded-[24px] border-2 border-primary/20 shadow-inner">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="text-primary font-black text-xl uppercase tracking-tighter">💰 GANANCIA REAL (LIMPIO)</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Después de descontar ${gastos.toFixed(0)} de gastos operativos</p>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-4xl font-black text-primary animate-pulse">
                                    ${(totales.ganancia - gastos).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Buscador */}
                <Input
                    placeholder="🔍 Buscar producto por nombre..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="mb-4"
                />

                {/* Tabla/Lista de productos */}
                <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest hidden md:grid">
                        <div className="col-span-4">Producto</div>
                        <div className="col-span-2 text-center">Cant</div>
                        <div className="col-span-2 text-right">Ingreso</div>
                        <div className="col-span-2 text-right">Costo</div>
                        <div className="col-span-2 text-right">Ganancia</div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                        {productosFiltrados.length === 0 ? (
                            <p className="text-center py-8 text-gray-500">No se encontraron productos</p>
                        ) : (
                            productosFiltrados.map((p, i) => (
                                <div key={i} className="p-4 md:p-3 grid grid-cols-1 md:grid-cols-12 gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="col-span-1 md:col-span-4 font-semibold text-gray-800 dark:text-gray-100">
                                        {p.nombre}
                                        <div className="md:hidden mt-1 flex gap-2">
                                            <Badge variant="success" className="text-[10px] py-0 px-1">Margen: {p.margen.toFixed(0)}%</Badge>
                                            <span className="text-xs text-gray-500 font-normal underline">Cant: {p.cantidad}</span>
                                        </div>
                                    </div>
                                    <div className="hidden md:block col-span-2 text-center text-gray-600 dark:text-gray-400 font-medium">
                                        {p.cantidad}
                                    </div>
                                    <div className="col-span-1 md:col-span-2 md:text-right flex justify-between md:block">
                                        <span className="md:hidden text-xs text-gray-400">Ingreso:</span>
                                        <span className="text-gray-600 dark:text-gray-400">${p.ingresos.toFixed(0)}</span>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 md:text-right flex justify-between md:block">
                                        <span className="md:hidden text-xs text-gray-400">Costo:</span>
                                        <span className="text-orange-600/70 dark:text-orange-400/70">${p.costos.toFixed(0)}</span>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 text-right flex justify-between md:block">
                                        <span className="md:hidden text-xs text-gray-400">Ganancia:</span>
                                        <span className="font-bold text-primary dark:text-primary-light">${p.ganancia.toFixed(0)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <p className="text-xs text-right text-gray-400 italic">
                    * Los valores están redondeados para mayor claridad visual.
                </p>
            </div>
        </Modal>
    )
}
