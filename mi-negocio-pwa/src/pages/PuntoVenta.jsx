// ============================================
// ¿QUÉ HACE ESTO?
// Interfaz completa de punto de venta
//
// FUNCIONALIDADES:
// - Buscar productos del inventario
// - Agregar al carrito
// - Venta rápida (productos sin registrar)
// - Métodos de pago: efectivo, tarjeta, fiado
// - Ver ventas del día
// - Validación de stock
// ============================================

import React, { useState, useEffect, useMemo } from 'react'
import { useVentasStore } from '../store/ventasStore'
import { useProductosStore } from '../store/productosStore'
import { useCajaStore } from '../store/cajaStore'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Input } from '../components/common/Input'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Layout } from '../components/layout/Layout'

export const PuntoVenta = () => {
  const { user, userData } = useAuthStore()
  const { cajaActual, verificarCajaAbierta } = useCajaStore()
  const { productos, cargarProductos } = useProductosStore()
  const {
    carrito,
    ventas,
    totalesDelDia,
    calcularTotal,
    agregarAlCarrito,
    agregarProductoRapido,
    actualizarCantidad,
    quitarDelCarrito,
    vaciarCarrito,
    procesarVenta,
    cargarVentasDelDia,
    cargarTotalesDelDia
  } = useVentasStore()

  // Estados
  const [busqueda, setBusqueda] = useState('')
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [modalPago, setModalPago] = useState(false)
  const [modalVentaRapida, setModalVentaRapida] = useState(false)
  const [mostrarVentas, setMostrarVentas] = useState(false)

  // Form Pago
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [clienteNombre, setClienteNombre] = useState('')
  const [procesando, setProcesando] = useState(false)

  // Form Venta Rápida
  const [nombreRapido, setNombreRapido] = useState('')
  const [precioRapido, setPrecioRapido] = useState('')
  const [cantidadRapido, setCantidadRapido] = useState('1')

  // Cargar datos al montar
  useEffect(() => {
    if (userData?.negocio_id) {
      verificarCajaAbierta(userData.negocio_id)
      cargarProductos(userData.negocio_id)
      cargarVentasDelDia(userData.negocio_id)
      cargarTotalesDelDia(userData.negocio_id)
    }
  }, [userData])

  // Filtrar productos al buscar
  useEffect(() => {
    if (busqueda.trim()) {
      const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
      setProductosFiltrados(filtrados)
    } else {
      setProductosFiltrados([])
    }
  }, [busqueda, productos])

  // Agregar producto
  const handleAgregarProducto = (producto) => {
    if (producto.stock_actual <= 0) {
      toast.error('Producto sin stock')
      return
    }
    agregarAlCarrito(producto, 1)
    setBusqueda('')
    setProductosFiltrados([])
    toast.success(`${producto.nombre} agregado`)
  }

  // Venta rápida
  const handleVentaRapida = (e) => {
    e.preventDefault()
    agregarProductoRapido(nombreRapido, parseFloat(precioRapido), parseInt(cantidadRapido))
    toast.success('Producto agregado')
    setModalVentaRapida(false)
    setNombreRapido('')
    setPrecioRapido('')
    setCantidadRapido('1')
  }

  // Procesar pago
  const handleProcesarPago = async (e) => {
    e.preventDefault()
    
    if (!cajaActual) {
      toast.error('Debes abrir una caja primero')
      return
    }

    if (metodoPago === 'fiado' && !clienteNombre.trim()) {
      toast.error('Ingresa el nombre del cliente para venta fiada')
      return
    }

    setProcesando(true)
    try {
      await procesarVenta(
        userData.negocio_id,
        user.id,
        cajaActual.id,
        metodoPago,
        clienteNombre || null
      )
      
      toast.success('✅ Venta registrada')
      setModalPago(false)
      setMetodoPago('efectivo')
      setClienteNombre('')
      
      // Recargar datos
      await verificarCajaAbierta(userData.negocio_id)
      await cargarProductos(userData.negocio_id)
      await cargarTotalesDelDia(userData.negocio_id)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setProcesando(false)
    }
  }

  const total = useMemo(() => calcularTotal(), [carrito])

 return (
  <Layout>

      {!cajaActual ? (
        /* Sin caja abierta */
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No hay caja abierta
            </h2>
            <p className="text-gray-600 mb-6">
              Debes abrir una caja para realizar ventas
            </p>
            <Button onClick={() => window.location.href = '/caja'}>
              Ir a Caja
            </Button>
          </Card>
        </div>
      ) : (
        /* Interfaz de ventas */
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Búsqueda y productos */}
            <div className="lg:col-span-2 space-y-4">
              {/* Búsqueda */}
              <Card>
                <div className="relative">
                  <Input
                    placeholder="🔍 Buscar producto..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                  />
                  {productosFiltrados.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                      {productosFiltrados.map(producto => (
                        <button
                          key={producto.id}
                          onClick={() => handleAgregarProducto(producto)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-gray-800">{producto.nombre}</p>
                              <p className="text-sm text-gray-500">Stock: {producto.stock_actual}</p>
                            </div>
                            <p className="text-lg font-bold text-primary">
                              ${producto.precio.toFixed(2)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="secondary"
                  className="w-full mt-3"
                  onClick={() => setModalVentaRapida(true)}
                >
                  ⚡ Venta Rápida (sin inventario)
                </Button>
              </Card>

              {/* Carrito */}
              <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Carrito ({carrito.length} items)
                </h3>
                {carrito.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-5xl mb-3">🛒</div>
                    <p>Carrito vacío</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {carrito.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{item.nombre}</p>
                          <p className="text-sm text-gray-600">
                            ${item.precio_unitario.toFixed(2)} x {item.cantidad}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => actualizarCantidad(index, item.cantidad - 1)}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-semibold">{item.cantidad}</span>
                          <button
                            onClick={() => actualizarCantidad(index, item.cantidad + 1)}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">
                            ${(item.precio_unitario * item.cantidad).toFixed(2)}
                          </p>
                          <button
                            onClick={() => quitarDelCarrito(index)}
                            className="text-xs text-danger hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Columna derecha: Total y acciones */}
            <div className="space-y-4">
              {/* Total */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Total</h3>
                <p className="text-4xl font-bold text-primary mb-4">
                  ${calcularTotal().toFixed(2)}
                </p>
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant="success"
                    disabled={carrito.length === 0}
                    onClick={() => setModalPago(true)}
                  >
                    Cobrar
                  </Button>
                  <Button
                    className="w-full"
                    variant="danger"
                    disabled={carrito.length === 0}
                    onClick={vaciarCarrito}
                  >
                    Vaciar Carrito
                  </Button>
                </div>
              </Card>

              {/* Totales del día */}
              {totalesDelDia && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Ventas de Hoy</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-bold">${totalesDelDia.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efectivo:</span>
                      <span className="font-bold text-green-600">${totalesDelDia.efectivo.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tarjeta:</span>
                      <span className="font-bold text-blue-600">${totalesDelDia.tarjeta.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fiado:</span>
                      <span className="font-bold text-orange-600">${totalesDelDia.fiado.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span>Cantidad:</span>
                      <span className="font-bold">{totalesDelDia.cantidad} ventas</span>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full mt-3"
                    onClick={() => setMostrarVentas(!mostrarVentas)}
                  >
                    {mostrarVentas ? 'Ocultar' : 'Ver'} Historial
                  </Button>
                </Card>
              )}

              {/* Historial */}
              {mostrarVentas && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    Últimas Ventas
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {ventas.slice(0, 10).map(venta => (
                      <div key={venta.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">${venta.total.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(venta.fecha), 'HH:mm', { locale: es })}
                            </p>
                          </div>
                          <Badge variant={
                            venta.metodo_pago === 'efectivo' ? 'success' :
                            venta.metodo_pago === 'tarjeta' ? 'primary' : 'warning'
                          }>
                            {venta.metodo_pago}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Venta Rápida */}
      <Modal
        isOpen={modalVentaRapida}
        onClose={() => setModalVentaRapida(false)}
        title="Venta Rápida"
      >
        <form onSubmit={handleVentaRapida} className="space-y-4">
          <p className="text-sm text-gray-600">
            Para productos que no están en el inventario
          </p>
          <Input
            label="Descripción *"
            value={nombreRapido}
            onChange={e => setNombreRapido(e.target.value)}
            placeholder="Ej: Servicio de reparación"
            required
          />
          <Input
            label="Precio *"
            type="number"
            step="0.01"
            value={precioRapido}
            onChange={e => setPrecioRapido(e.target.value)}
            placeholder="0.00"
            required
          />
          <Input
            label="Cantidad *"
            type="number"
            value={cantidadRapido}
            onChange={e => setCantidadRapido(e.target.value)}
            placeholder="1"
            required
          />
          <Button type="submit" className="w-full">
            Agregar al Carrito
          </Button>
        </form>
      </Modal>

      {/* Modal Pago */}
      <Modal
        isOpen={modalPago}
        onClose={() => setModalPago(false)}
        title="Procesar Pago"
      >
        <form onSubmit={handleProcesarPago} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-1">Total a cobrar:</p>
            <p className="text-4xl font-bold text-primary">${calcularTotal().toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de pago *
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="metodo"
                  value="efectivo"
                  checked={metodoPago === 'efectivo'}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="mr-3"
                />
                <span className="font-semibold">💵 Efectivo</span>
              </label>
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="metodo"
                  value="tarjeta"
                  checked={metodoPago === 'tarjeta'}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="mr-3"
                />
                <span className="font-semibold">💳 Tarjeta</span>
              </label>
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="metodo"
                  value="fiado"
                  checked={metodoPago === 'fiado'}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="mr-3"
                />
                <span className="font-semibold">📝 Fiado</span>
              </label>
            </div>
          </div>

          {metodoPago === 'fiado' && (
            <Input
              label="Nombre del cliente *"
              value={clienteNombre}
              onChange={e => setClienteNombre(e.target.value)}
              placeholder="Juan Pérez"
              required
            />
          )}

          <Button
            type="submit"
            variant="success"
            className="w-full"
            disabled={procesando}
          >
            {procesando ? 'Procesando...' : 'Confirmar Venta'}
          </Button>
        </form>
      </Modal>
    </Layout>
  )
}