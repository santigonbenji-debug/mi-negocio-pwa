import React, { useState, useEffect } from 'react'
import { useFiadosStore } from '../store/fiadosStore'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/layout/Layout'
import { exportarFiados } from '../utils/exportFiados'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Input } from '../components/common/Input'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DetalleVentaModal } from '../components/ventas/DetalleVentaModal'
import { HelpButton } from '../components/common/HelpButton'
import { SectionGuide } from '../components/common/SectionGuide'
import { useLicenciaContext } from '../contexts/LicenciaContext'

export const Fiados = () => {
  const { user } = useAuthStore()

  // Estado de licencia
  const { puedeEditar, modoSoloLectura } = useLicenciaContext()
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
    eliminarCliente,
    cargarEstadisticas,
    limpiarSeleccion
  } = useFiadosStore()

  const [modalDetalle, setModalDetalle] = useState(false)
  const [modalPago, setModalPago] = useState(false)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalDetalleVenta, setModalDetalleVenta] = useState(false)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)

  const [montoPago, setMontoPago] = useState('')
  const [descripcionPago, setDescripcionPago] = useState('')

  const [nombreNuevo, setNombreNuevo] = useState('')
  const [telefonoNuevo, setTelefonoNuevo] = useState('')
  const [modalAyuda, setModalAyuda] = useState(false)

  const pasosAyudaFiados = [
    { title: '📒 ¿Qué es un Fiado?', description: 'Es una venta que te pagan después. El sistema guarda cuánto te debe cada cliente automáticamente.' },
    { title: '👤 Clientes', description: 'Haz clic en un cliente para ver su historial completo de compras y pagos.' },
    { title: '💵 Registrar Pagos', description: 'Incluso si te pagan más de lo que deben, el sistema guardará el "Saldo a Favor" para su próxima compra.' },
    { title: '📊 Exportar', description: 'Usa el botón de Excel para tener una lista de quién te debe y cuánto, por si quieres cobrar por WhatsApp.' }
  ]

  useEffect(() => {
    if (user?.negocio_id) {
      cargarClientes(user.negocio_id)
      cargarEstadisticas(user.negocio_id)
    }
  }, [user])

  const handleVerDetalle = async (cliente) => {
    await seleccionarCliente(cliente.id)
    setModalDetalle(true)
  }

  const handleAbrirPago = () => {
    setModalDetalle(false)
    setModalPago(true)
  }

  const handleRegistrarPago = async (e) => {
    e.preventDefault()

    if (!clienteActual) return

    const monto = parseFloat(montoPago)

    if (monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    // ELIMINADO: Restricción de monto > deuda para permitir saldo a favor

    try {
      await registrarPago(clienteActual.id, monto, descripcionPago || 'Pago')
      toast.success('✅ Pago registrado')
      setModalPago(false)
      setMontoPago('')
      setDescripcionPago('')

      await cargarEstadisticas(user.negocio_id)

      if (monto === clienteActual.deuda_total) {
        setModalDetalle(false)
      } else {
        setModalDetalle(true)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleCrearCliente = async (e) => {
    e.preventDefault()

    try {
      await crearCliente(user.negocio_id, nombreNuevo, telefonoNuevo || null)
      toast.success('✅ Cliente agregado')
      setModalNuevo(false)
      setNombreNuevo('')
      setTelefonoNuevo('')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleVerDetalleVenta = (ventaId) => {
    setVentaSeleccionada(ventaId)
    setModalDetalleVenta(true)
  }
  const handleEliminarCliente = async (cliente) => {
    if (!window.confirm(`¿Estas seguro de eliminar a ${cliente.cliente_nombre}?\n\nEsta accion no se puede deshacer.`)) {
      return
    }

    try {
      await eliminarCliente(cliente.id)
      toast.success('Cliente eliminado correctamente')
      await cargarEstadisticas(user.negocio_id)
    } catch (error) {
      console.error('Error al eliminar:', error)
      toast.error(error.message || 'Error al eliminar cliente')
    }
  }

  const handleExportar = () => {
    try {
      exportarFiados(clientes)
      toast.success('✅ Fiados exportados correctamente')
    } catch (error) {
      toast.error('Error al exportar fiados')
      console.error(error)
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Banner de solo lectura */}
        {modoSoloLectura && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🔒</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Modo Solo Lectura</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Podés consultar cuentas corrientes pero no registrar movimientos. Renová tu licencia.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-primary dark:text-primary-light italic">📒 Clientes Fiados</h1>
              <HelpButton onClick={() => setModalAyuda(true)} />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button
                variant="secondary"
                onClick={handleExportar}
                disabled={clientes.length === 0}
                className="flex-1 md:flex-none"
              >
                📊 Exportar Excel
              </Button>
              <Button onClick={() => setModalNuevo(true)} className="flex-1 md:flex-none whitespace-nowrap" disabled={!puedeEditar}>
                {!puedeEditar ? '🔒 Bloqueado' : '+ Agregar Cliente'}
              </Button>
            </div>
          </div>

          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card padding="p-4" className="border-l-4 border-red-500">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deuda Total</p>
                <p className="text-2xl font-black text-danger">
                  ${estadisticas.totalDeuda.toFixed(2)}
                </p>
              </Card>
              <Card padding="p-4" className="border-l-4 border-green-500">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Saldo a Favor Total</p>
                <p className="text-2xl font-black text-green-600 dark:text-green-400">
                  ${estadisticas.totalSaldoAFavor.toFixed(2)}
                </p>
              </Card>
              <Card padding="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Clientes c/ Deuda</p>
                <p className="text-2xl font-black text-primary dark:text-primary-light">
                  {estadisticas.clientesConDeuda}
                </p>
              </Card>
              <Card padding="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deuda Máxima</p>
                <p className="text-2xl font-black text-warning">
                  ${estadisticas.deudaMasAlta.toFixed(2)}
                </p>
              </Card>
            </div>
          )}
        </div>

        {cargando ? (
          <Card className="text-center py-12">
            <p className="text-xl text-gray-600">Cargando clientes...</p>
          </Card>
        ) : clientes.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">📒</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              No hay clientes fiados
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Los clientes fiados aparecerán aquí cuando realices ventas con el método "Fiado".
            </p>
            <Button onClick={() => setModalNuevo(true)} disabled={!puedeEditar}>
              {!puedeEditar ? '🔒 Bloqueado' : '+ Agregar Primer Cliente'}
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
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                        {cliente.cliente_nombre}
                      </h3>
                      {cliente.telefono && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          📞 {cliente.telefono}
                        </p>
                      )}
                    </div>
                    {tieneDeuda ? (
                      <Badge variant="danger">Debe</Badge>
                    ) : (
                      <Badge variant="success">Al dia</Badge>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{deuda < 0 ? 'Saldo a Favor:' : 'Deuda:'}</p>
                    <p className={`text-3xl font-bold ${deuda > 0 ? 'text-danger' : deuda < 0 ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                      ${Math.abs(deuda).toFixed(2)}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Cliente desde {format(new Date(cliente.creado_en), 'dd/MM/yyyy', { locale: es })}
                    </p>

                    {!tieneDeuda && (
                      <Button
                        variant="danger"
                        className="text-xs py-1 px-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEliminarCliente(cliente)
                        }}
                        disabled={!puedeEditar}
                      >
                        {!puedeEditar ? '🔒' : '🗑️ Eliminar'}
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

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
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{parseFloat(clienteActual.deuda_total) < 0 ? 'Saldo a Favor:' : 'Deuda Actual:'}</p>
                  <p className={`text-3xl font-bold ${parseFloat(clienteActual.deuda_total) > 0 ? 'text-danger' : 'text-green-600'}`}>
                    ${Math.abs(parseFloat(clienteActual.deuda_total)).toFixed(2)}
                  </p>
                </div>
                {clienteActual.telefono && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Telefono:</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{clienteActual.telefono}</p>
                  </div>
                )}
              </div>
              <Button
                variant="success"
                className="w-full mt-3"
                onClick={handleAbrirPago}
                disabled={!puedeEditar}
              >
                {!puedeEditar ? '🔒 Bloqueado' : (parseFloat(clienteActual.deuda_total) <= 0 ? 'Agregar Saldo' : 'Registrar Pago')}
              </Button>
            </div>

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
                      className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg ${mov.venta_id ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors' : ''
                        }`}
                      onClick={() => mov.venta_id && handleVerDetalleVenta(mov.venta_id)}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {mov.descripcion}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(mov.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                        </p>
                        {mov.venta_id && (
                          <p className="text-xs text-primary font-semibold mt-1">
                            Click para ver detalle →
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={mov.tipo === 'compra' ? 'danger' : 'success'}>
                          {mov.tipo === 'compra' ? '+' : '-'}${parseFloat(mov.monto).toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

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
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl text-center border dark:border-gray-700/50 mb-6">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Deuda actual:</p>
              <p className="text-4xl font-black text-danger">
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
              label="Descripcion (opcional)"
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
              <Button type="submit" variant="success" className="flex-1" disabled={!puedeEditar}>
                {!puedeEditar ? '🔒 Licencia expirada' : 'Confirmar Pago'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={modalNuevo}
        onClose={() => setModalNuevo(false)}
        title="Nuevo Cliente Fiado"
      >
        <form onSubmit={handleCrearCliente} className="space-y-4">
          <p className="text-sm text-gray-600">
            Nota: El cliente se agregara sin deuda inicial. La deuda se registrara automaticamente cuando realices ventas con el metodo "Fiado".
          </p>

          <Input
            label="Nombre del cliente *"
            value={nombreNuevo}
            onChange={e => setNombreNuevo(e.target.value)}
            placeholder="Juan Perez"
            required
          />

          <Input
            label="Telefono (opcional)"
            type="tel"
            value={telefonoNuevo}
            onChange={e => setTelefonoNuevo(e.target.value)}
            placeholder="1234567890"
          />

          <Button type="submit" className="w-full" disabled={!puedeEditar}>
            {!puedeEditar ? '🔒 Licencia expirada' : 'Agregar Cliente'}
          </Button>
        </form>
      </Modal>

      <DetalleVentaModal
        isOpen={modalDetalleVenta}
        onClose={() => {
          setModalDetalleVenta(false)
          setVentaSeleccionada(null)
        }}
        ventaId={ventaSeleccionada}
      />
      <SectionGuide
        isOpen={modalAyuda}
        onClose={() => setModalAyuda(false)}
        title="Clientes Fiados"
        steps={pasosAyudaFiados}
      />
    </Layout>
  )
}