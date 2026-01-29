import React, { useMemo } from 'react'
import { Modal } from '../common/Modal'
import { Badge } from '../common/Badge'

export const DetalleCategoriasModal = ({ isOpen, onClose, datos, mesStr }) => {

    const totales = useMemo(() => {
        return datos.reduce((acc, curr) => ({
            ganancia: acc.ganancia + curr.ganancia,
            ingresos: acc.ingresos + curr.ingresos
        }), { ganancia: 0, ingresos: 0 })
    }, [datos])

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Márgenes por Categoría - ${mesStr}`}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                        <span>📊</span> ¿Qué significan estos números?
                    </h4>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-4">
                        <li><b>Ingresos</b>: Es el dinero total que entró por las ventas de esta categoría.</li>
                        <li><b>Ganancia</b>: Es el dinero "limpio" que te queda después de restar el costo de los productos.</li>
                        <li><b>Margen %</b>: Es la rentabilidad. Un margen de 50% significa que por cada $100 que vendes, $50 son ganancia real.</li>
                    </ul>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Ranking de rentabilidad basado en tus ventas de {mesStr}:
                </p>

                <div className="space-y-4">
                    {datos.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">No hay datos de categorías en este período</p>
                    ) : (
                        datos.map((cat, i) => {
                            // Calcular qué porcentaje de la ganancia total representa esta categoría
                            const pesoEnGanancia = totales.ganancia > 0 ? (cat.ganancia / totales.ganancia * 100) : 0

                            return (
                                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{cat.nombre}</h3>
                                        </div>
                                        <Badge variant="primary">
                                            {cat.margen.toFixed(0)}% margen
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Ingresos</p>
                                            <p className="font-bold text-gray-700 dark:text-gray-300">${cat.ingresos.toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Ganancia</p>
                                            <p className="font-bold text-primary dark:text-primary-light">${cat.ganancia.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {/* Barra de progreso visual del peso en ganancia */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-gray-400">
                                            <span>CONTRIBUCIÓN A LA GANANCIA TOTAL</span>
                                            <span>{pesoEnGanancia.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary/60"
                                                style={{ width: `${Math.min(100, pesoEnGanancia)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed text-center">
                        💡 <b>Tip Negocio</b>: Las categorías con más alto margen son tus motores de crecimiento. ¡Asegura que nunca falte stock de ellas!
                    </p>
                </div>
            </div>
        </Modal>
    )
}
