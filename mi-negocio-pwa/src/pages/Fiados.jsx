// ============================================
// ¿QUÉ HACE ESTO?
// Página completa de gestión de fiados
//
// FUNCIONALIDADES:
// - Ver lista de clientes con deuda
// - Ver estadísticas generales
// - Ver detalle de cliente (historial)
// - Registrar pagos
// - Agregar nuevos clientes
// ============================================

import React, { useState, useEffect } from 'react'
import { useFiadosStore } from '../store/fiadosStore'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Input } from '../components/common/Input'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const Fiados = () => {
  const { userData } = useAuthStore()
  const {
    clientes,
    clienteActual,
    movimientos,
    estadisticas,
    cargando,
    cargarClientes,
    seleccionarCliente,
    registrarPago,
    crearCliente,
    cargarEstadisticas,
    limpiarSeleccion
  } = useFiadosStore()

  // Modales
  const [modalDetalle, setModalDetalle] = useState(false)
  const [modalPago, setModalPago] = useState(false)
  const [modalNuevo, setModalNuevo] = useState(false)

  // Form Pago
  const [montoPago, setMontoPago] = useState('')
  const [descripcionPago, setDescripcionPago] = useState('')

  // Form Nuevo Cliente
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [telefonoNuevo, setTelefonoNuevo] = useState('')

  // Cargar datos al montar
  useEffect(() => {
    if (userData?.negocio_id) {
      cargarClientes(userData.negocio_id)
      cargarEstadisticas(userData.negocio_id)
    }
  }, [userData])

  // Ver detalle de cliente
  const handleVerDetalle = async (cliente) => {
    await seleccionarCliente(cliente.id)
    setModalDetalle(true)
  }

  // Abrir modal de pago
  const handleAbrirPago = () => {
    setModalDetalle(false)
    setModalPago(true)
  }

  // Registrar pago
  const handleRegistrarPago = async (e) => {
    e.preventDefault()
    
    if (!clienteActual) return

    const monto = parseFloat(montoPago)
    
    if (monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    if (monto > clienteActual.deuda_total) {
      toast.error('El monto no puede ser mayor a la deuda')
      return
    }

    try {
      await registrarPago(clienteActual.id, monto, descripcionPago || 'Pago')
      toast.success('✅ Pago registrado')
      setModalPago(false)
      setMontoPago('')
      setDescripcionPago('')
      
      // Recargar estadísticas
      await cargarEstadisticas(userData.negocio_id)
      
      // Si pagó todo, cerrar modal
      if (monto === clienteActual.deuda_total) {
        setModalDetalle(false)
      } else {
        setModalDetalle(true)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Crear nuevo cliente
  const handleCrearCliente = async (e) => {
    e.preventDefault()
    
    try {
      await crearCliente(userData.negocio_id, nombreNuevo, telefonoNuevo || null)
      toast.success('✅ Cliente agregado')
      setModalNuevo(false)
      setNombreNuevo('')
      setTelefonoNuevo('')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header con estadísticas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-primary">📝 Fiados</h1>
            <Button onClick={() => setModalNuevo(true)}>
              + Nuevo Cliente
            </Button>
          </div>

          {/* Estadísticas */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card padding="p-4">
                <p className="text-sm text-gray-600 mb-1">Deuda Total</p>
                <p className="text-2xl font-bold text-danger">
                  ${estadisticas.totalDeuda.toFixed(2)}
                </p>
              </Card>
              <Card padding="p-4">
                <p className="text-sm text-gray-600 mb-1">Clientes con Deuda</p>
                <p className="text-2xl font-bold text-primary">
                  {estadisticas.clientesConDeuda}
                </p>
              </Card>
              <Card padding="p-4">
                <p className="text-sm text-gray-600 mb-1">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-800">
                  {estadisticas.totalClientes}
                </p>
              </Card>
              <Card padding="p-4">
                <p className="text-sm text-gray-600 mb-1">Deuda Más Alta</p>
                <p className="text-2xl font-bold text-warning">
                  ${estadisticas.deudaMasAlta.toFixed(2)}
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* Lista de clientes */}
        {cargando ? (
          <Card className="text-center py-12">
            <p className="text-xl text-gray-600">Cargando clientes...</p>
          </Card>
        ) : clientes.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No hay clientes fiados
            </h2>
            <p className="text-gray-600 mb-6">
              Los clientes fiados aparecerán aquí cuando realices ventas con el método "Fiado"
            </p>
            <Button onClick={() => setModalNuevo(true)}>
              + Agregar Primer Cliente
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientes.map(cliente => {
              const deuda = parseFloat(cliente.deuda_total)
              const tieneDeuda = deuda > 0
              
              return (
                <Card
                  key={cliente.id}
                  className="hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => handleVerDetalle(cliente)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">
                        {cliente.cliente_nombre}
                      </h3>
                      {cliente.telefono && (
                        <p className="text-sm text-gray-500">
                          📞 {cliente.telefono}
                        </p>
                      )}
                    </div>
                    {tieneDeuda ? (
                      <Badge variant="danger">Debe</Badge>
                    ) : (
                      <Badge variant="success">Al día</Badge>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Saldo:</p>
                    <p className={`text-3xl font-bold ${tieneDeuda ? 'text-danger' : 'text-success'}`}>
                      ${deuda.toFixed(2)}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Cliente desde {format(new Date(cliente.creado_en), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Detalle Cliente */}
      <Modal
        isOpen={modalDetalle}
        onClose={() => {
          setModalDetalle(false)
          limpiarSeleccion()
        }}
        title={clienteActual?.cliente_nombre || 'Detalle'}
        maxWidth="max-w-2xl"
      >
        {clienteActual && (
          <div className="space-y-4">
            {/* Info del cliente */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-600">Deuda Actual:</p>
                  <p className="text-3xl font-bold text-danger">
                    ${parseFloat(clienteActual.deuda_total).toFixed(2)}
                  </p>
                </div>
                {clienteActual.telefono && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Teléfono:</p>
                    <p className="font-semibold">{clienteActual.telefono}</p>
                  </div>
                )}
              </div>
              {parseFloat(clienteActual.deuda_total) > 0 && (
                <Button
                  variant="success"
                  className="w-full mt-3"
                  onClick={handleAbrirPago}
                >
                  Registrar Pago
                </Button>
              )}
            </div>

            {/* Historial de movimientos */}
            <div>
              <h3 className="font-bold text-lg mb-3">
                Historial ({movimientos.length} movimientos)
              </h3>
              {movimientos.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay movimientos registrados
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {movimientos.map(mov => (
                    <div
                      key={mov.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {mov.descripcion}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(mov.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                        </p>
                      </div>
                      <Badge variant={mov.tipo === 'compra' ? 'danger' : 'success'}>
                        {mov.tipo === 'compra' ? '+' : '-'}${parseFloat(mov.monto).toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Registrar Pago */}
      <Modal
        isOpen={modalPago}
        onClose={() => {
          setModalPago(false)
          setModalDetalle(true)
        }}
        title="Registrar Pago"
      >
        {clienteActual && (
          <form onSubmit={handleRegistrarPago} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Deuda actual:</p>
              <p className="text-3xl font-bold text-danger">
                ${parseFloat(clienteActual.deuda_total).toFixed(2)}
              </p>
            </div>

            <Input
              label="Monto del pago *"
              type="number"
              step="0.01"
              value={montoPago}
              onChange={e => setMontoPago(e.target.value)}
              placeholder="0.00"
              required
            />

            <Input
              label="Descripción (opcional)"
              value={descripcionPago}
              onChange={e => setDescripcionPago(e.target.value)}
              placeholder="Ej: Pago parcial"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setModalPago(false)
                  setModalDetalle(true)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="success" className="flex-1">
                Confirmar Pago
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Nuevo Cliente */}
      <Modal
        isOpen={modalNuevo}
        onClose={() => setModalNuevo(false)}
        title="Nuevo Cliente Fiado"
      >
        <form onSubmit={handleCrearCliente} className="space-y-4">
          <p className="text-sm text-gray-600">
            Nota: El cliente se agregará sin deuda inicial. La deuda se registrará automáticamente cuando realices ventas con el método "Fiado".
          </p>
          
          <Input
            label="Nombre del cliente *"
            value={nombreNuevo}
            onChange={e => setNombreNuevo(e.target.value)}
            placeholder="Juan Pérez"
            required
          />

          <Input
            label="Teléfono (opcional)"
            type="tel"
            value={telefonoNuevo}
            onChange={e => setTelefonoNuevo(e.target.value)}
            placeholder="1234567890"
          />

          <Button type="submit" className="w-full">
            Agregar Cliente
          </Button>
        </form>
      </Modal>
    </Layout>
  )
}