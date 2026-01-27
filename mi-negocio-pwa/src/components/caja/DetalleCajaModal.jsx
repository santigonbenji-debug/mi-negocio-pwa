// ============================================
// ¿QUÉ HACE ESTO?
// Modal reutilizable para mostrar detalles de una caja
//
// MUESTRA:
// - Fechas de apertura/cierre
// - Montos: inicial, esperado, real
// - Lista de movimientos con tipo y monto
//
// USO:
// <DetalleCajaModal
//   isOpen={modalAbierto}
//   onClose={() => setModalAbierto(false)}
//   caja={cajaSeleccionada}
//   movimientos={movimientosDeLaCaja}
// />
// ============================================

import React from 'react'
import { Modal } from '../common/Modal'
import { Badge } from '../common/Badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const DetalleCajaModal = ({ isOpen, onClose, caja, movimientos = [] }) => {
  if (!caja) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Caja"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Fecha Apertura</p>
            <p className="font-semibold">
              {format(new Date(caja.fecha_apertura), "dd/MM/yyyy HH:mm", { locale: es })}
            </p>
          </div>
          {caja.fecha_cierre && (
            <div>
              <p className="text-sm text-gray-600">Fecha Cierre</p>
              <p className="font-semibold">
                {format(new Date(caja.fecha_cierre), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>
          )}
        </div>

        {/* Montos */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Monto Inicial</p>
            <p className="text-xl font-bold">${parseFloat(caja.monto_inicial).toFixed(2)}</p>
          </div>
          {caja.monto_esperado && (
            <div>
              <p className="text-sm text-gray-600">Monto Esperado</p>
              <p className="text-xl font-bold">${parseFloat(caja.monto_esperado).toFixed(2)}</p>
            </div>
          )}
          {caja.monto_real && (
            <div>
              <p className="text-sm text-gray-600">Monto Real</p>
              <p className="text-xl font-bold">${parseFloat(caja.monto_real).toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Diferencia (si la caja está cerrada) */}
        {caja.estado === 'cerrada' && caja.diferencia !== null && (
          <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
            <span className="font-semibold">Diferencia:</span>
            <Badge variant={caja.diferencia === 0 ? 'success' : caja.diferencia > 0 ? 'success' : 'danger'}>
              {caja.diferencia > 0 ? '+' : ''}${parseFloat(caja.diferencia).toFixed(2)}
            </Badge>
          </div>
        )}

        {/* Movimientos */}
        <div>
          <h4 className="font-bold text-lg mb-3">
            Movimientos ({movimientos.length})
          </h4>
          {movimientos.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No hay movimientos</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {movimientos.map(mov => (
                <div key={mov.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold">{mov.concepto}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(mov.fecha), "HH:mm", { locale: es })}
                    </p>
                  </div>
                  <Badge variant={mov.tipo === 'ingreso' ? 'success' : 'danger'}>
                    {mov.tipo === 'ingreso' ? '+' : '-'}${parseFloat(mov.monto).toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observaciones (si existen) */}
        {caja.observaciones && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Observaciones:</p>
            <p className="text-gray-800">{caja.observaciones}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
