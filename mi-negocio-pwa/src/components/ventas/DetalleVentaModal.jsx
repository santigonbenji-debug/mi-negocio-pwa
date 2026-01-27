// ============================================
// MODAL DE DETALLE DE VENTA
// Muestra el desglose completo de una venta
// ============================================

import React, { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { Badge } from '../common/Badge'
import { ventasService } from '../../services/ventas'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const DetalleVentaModal = ({ isOpen, onClose, ventaId }) => {
  const [venta, setVenta] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (isOpen && ventaId) {
      cargarDetalle()
    }
  }, [isOpen, ventaId])

  const cargarDetalle = async () => {
    setCargando(true)
    try {
      const data = await ventasService.obtenerDetalles(ventaId)
      setVenta(data)
    } catch (error) {
      console.error('Error al cargar detalle:', error)
    } finally {
      setCargando(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Venta #${ventaId?.slice(0, 8)}`}
      maxWidth="max-w-2xl"
    >
      {cargando ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Cargando detalle...</p>
        </div>
      ) : venta ? (
        <div className="space-y-6">
          {/* Encabezado */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-semibold">
                  {format(new Date(venta.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vendedor</p>
                <p className="font-semibold">{venta.usuarios?.nombre || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo de Venta</p>
                <Badge variant={venta.tipo === 'stock' ? 'default' : 'warning'}>
                  {venta.tipo === 'stock' ? '📦 Inventario' : '⚡ Rápida'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Método de Pago</p>
                <Badge variant={
                  venta.metodo_pago === 'efectivo' ? 'success' :
                  venta.metodo_pago === 'tarjeta' ? 'default' : 'warning'
                }>
                  {venta.metodo_pago === 'efectivo' ? '💵 Efectivo' :
                   venta.metodo_pago === 'tarjeta' ? '💳 Transferencia' : '📝 Fiado'}
                </Badge>
              </div>
              {venta.cliente_nombre && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-semibold">{venta.cliente_nombre}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items de la venta */}
          <div>
            <h3 className="font-bold text-lg mb-3">Productos / Servicios</h3>
            <div className="space-y-2">
              {venta.ventas_items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {item.productos?.nombre || item.descripcion_momento_venta}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${parseFloat(item.precio_unitario).toFixed(2)} × {item.cantidad}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      ${(parseFloat(item.precio_unitario) * item.cantidad).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-gray-800">TOTAL</span>
              <span className="text-3xl font-bold text-primary">
                ${parseFloat(venta.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No se pudo cargar el detalle</p>
        </div>
      )}
    </Modal>
  )
}