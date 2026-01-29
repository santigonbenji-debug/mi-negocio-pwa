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
import { useFiadosStore } from '../store/fiadosStore'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Input } from '../components/common/Input'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Layout } from '../components/layout/Layout'
import { DetalleVentaModal } from '../components/ventas/DetalleVentaModal'
import { ScannerBarcode } from '../components/common/ScannerBarcode'
import { HelpButton } from '../components/common/HelpButton'
import { SectionGuide } from '../components/common/SectionGuide'
import { MobileActions } from '../components/common/MobileActions'

export const PuntoVenta = () => {
  const { user } = useAuthStore()
  const { cajaActual, verificarCajaAbierta } = useCajaStore()
  const { clientes: clientesFiados, cargarClientes: cargarClientesFiados } = useFiadosStore()
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

  // Modales y Selección
  const [modalDetalle, setModalDetalle] = useState(false)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)

  // Form Pago
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [clienteNombre, setClienteNombre] = useState('')
  const [esClienteNuevo, setEsClienteNuevo] = useState(false)
  const [procesando, setProcesando] = useState(false)

  // Form Venta Rápida
  const [nombreRapido, setNombreRapido] = useState('')
  const [precioRapido, setPrecioRapido] = useState('')
  const [cantidadRapido, setCantidadRapido] = useState('1')

  // Modal cantidad para productos por KG
  const [modalCantidadKg, setModalCantidadKg] = useState(false)
  const [productoKgSeleccionado, setProductoKgSeleccionado] = useState(null)
  const [cantidadKg, setCantidadKg] = useState('')

  // Auxiliares
  const [mostrarScanner, setMostrarScanner] = useState(false)
  const [modalAyuda, setModalAyuda] = useState(false)

  const pasosAyudaPuntoVenta = [
    { title: '🔍 Buscar o Escanear', description: 'Escribe el nombre del producto o usa la cámara para escanear el código de barras.' },
    { title: '⚖️ Productos por KG', description: 'Si un producto se vende por peso, el sistema te pedirá los KG exactos al seleccionarlo.' },
    { title: '⚡ Venta Rápida', description: 'Usa el botón "+" para vender algo que no tienes en el inventario.' },
    { title: '💳 Métodos de Pago', description: 'Efectivo, Transferencia o Fiado (si el cliente ya está registrado).' }
  ]

  // Cargar datos al montar
  useEffect(() => {
    if (user?.negocio_id) {
      verificarCajaAbierta(user.negocio_id)
      cargarProductos(user.negocio_id)
      cargarVentasDelDia(user.negocio_id)
      cargarTotalesDelDia(user.negocio_id)
      cargarClientesFiados(user.negocio_id)
    }
  }, [user])

  // Filtrar productos al buscar
  useEffect(() => {
    if (busqueda.trim()) {
      const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigo_barras && p.codigo_barras.includes(busqueda))
      )
      setProductosFiltrados(filtrados)
    } else {
      setProductosFiltrados([])
    }
  }, [busqueda, productos])

  const handleAgregarProducto = (producto) => {
    if (producto.stock_actual <= 0 && !producto.es_por_kg) {
      toast.error('Producto sin stock')
      return
    }

    if (producto.es_por_kg) {
      setProductoKgSeleccionado(producto)
      setModalCantidadKg(true)
      setBusqueda('')
    } else {
      agregarAlCarrito(producto, 1)
      setBusqueda('')
      toast.success(`${producto.nombre} agregado`)
    }
  }

  const handleConfirmarCantidadKg = (e) => {
    e.preventDefault()
    const cantidadEnKg = parseFloat(cantidadKg) / 1000
    if (isNaN(cantidadEnKg) || cantidadEnKg <= 0) {
      toast.error('Ingresa una cantidad válida')
      return
    }
    agregarAlCarrito(productoKgSeleccionado, cantidadEnKg)
    toast.success(`${cantidadKg}g de ${productoKgSeleccionado.nombre} agregado`)
    setModalCantidadKg(false)
    setProductoKgSeleccionado(null)
    setCantidadKg('')
  }

  const handleScanSuccess = (codigo) => {
    const producto = productos.find(p => p.codigo_barras === codigo)
    if (producto) {
      handleAgregarProducto(producto)
    } else {
      toast.error('Producto no encontrado')
      setBusqueda(codigo)
    }
    setMostrarScanner(false)
  }

  const handleVentaRapida = (e) => {
    e.preventDefault()
    agregarProductoRapido(nombreRapido, parseFloat(precioRapido), parseInt(cantidadRapido))
    toast.success('Producto agregado')
    setModalVentaRapida(false)
    setNombreRapido('')
    setPrecioRapido('')
    setCantidadRapido('1')
  }

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
      await procesarVenta(user.negocio_id, user.id, cajaActual.id, metodoPago, clienteNombre || null)
      toast.success('✅ Venta registrada')
      setModalPago(false)
      setMetodoPago('efectivo')
      setClienteNombre('')
      setEsClienteNuevo(false)
      await verificarCajaAbierta(user.negocio_id)
      await cargarProductos(user.negocio_id)
      await cargarTotalesDelDia(user.negocio_id)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setProcesando(false)
    }
  }

  const handleVerDetalle = (ventaId) => {
    setVentaSeleccionada(ventaId)
    setModalDetalle(true)
  }

  const total = useMemo(() => calcularTotal(), [carrito])

  return (
    <Layout>
      {!cajaActual ? (
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <Card className="py-12 border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="text-7xl mb-6">🔒</div>
            <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2 uppercase">Caja Cerrada</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">Debes abrir una caja de administración para comenzar a vender.</p>
            <Button onClick={() => window.location.href = '/caja'} className="py-4 px-8 text-lg">💰 Ir a Abrir Caja</Button>
          </Card>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 mb-20 lg:mb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-10 gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black text-primary dark:text-primary-light italic">🛒 Punto de Venta</h1>
              <HelpButton onClick={() => setModalAyuda(true)} />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Button
                variant={mostrarVentas ? 'primary' : 'secondary'}
                onClick={() => setMostrarVentas(!mostrarVentas)}
                className="relative whitespace-nowrap lg:hidden"
              >
                {mostrarVentas ? '🔙 Vender' : '📄 Ver Ventas'}
                {!mostrarVentas && totalesDelDia?.cantidad > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {totalesDelDia.cantidad}
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 space-y-4 ${mostrarVentas ? 'hidden lg:block' : 'block'}`}>

              <div className="sticky top-16 z-[40] -mx-2 sm:mx-0">
                <Card className="shadow-2xl border-primary/30 py-4">
                  <div className="flex gap-2 relative">
                    <div className="flex-1">
                      <Input
                        placeholder="🔍 Nombre o Código..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="text-lg py-4 sm:py-6"
                        autoFocus
                      />
                    </div>
                    <Button variant="secondary" onClick={() => setMostrarScanner(true)} className="px-6">📷</Button>

                    {productosFiltrados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-gray-800 border-2 border-primary/20 rounded-2xl shadow-2xl max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 animate-in fade-in slide-in-from-top-2">
                        {productosFiltrados.map(producto => (
                          <button
                            key={producto.id}
                            onClick={() => handleAgregarProducto(producto)}
                            className="w-full text-left px-5 py-4 hover:bg-primary/5 transition-colors flex justify-between items-center group"
                          >
                            <div className="min-w-0 pr-4">
                              <p className="font-black text-gray-800 dark:text-gray-100 truncate group-hover:text-primary">{producto.nombre}</p>
                              <Badge variant={producto.stock_actual <= producto.stock_minimo ? 'danger' : 'success'} className="mt-1">Stock: {producto.stock_actual}</Badge>
                            </div>
                            <p className="text-xl font-black text-primary whitespace-nowrap">${producto.precio.toFixed(2)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {!busqueda && (
                    <div className="hidden sm:block mt-4 pt-4 border-t dark:border-gray-700">
                      <Button variant="secondary" className="w-full text-xs italic" onClick={() => setModalVentaRapida(true)}>⚡ Venta Rápida</Button>
                    </div>
                  )}
                </Card>
              </div>

              {!busqueda && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">🚀 Productos Frecuentes</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {productos.slice(0, 12).map(producto => (
                      <button
                        key={producto.id}
                        onClick={() => handleAgregarProducto(producto)}
                        className="flex flex-col items-center gap-1 p-2 rounded-2xl border-2 border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-90 group"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
                          {producto.nombre.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-[9px] font-black text-gray-500 truncate w-full uppercase">{producto.nombre}</p>
                        <p className="text-xs font-black text-primary">${producto.precio.toFixed(0)}</p>
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase italic">🛒 Carrito</h3>
                  <Badge variant="primary">{carrito.length} Items</Badge>
                </div>

                {carrito.length === 0 ? (
                  <div className="text-center py-20 opacity-20"><p className="text-6xl mb-2">📦</p><p className="font-black uppercase">Vacío</p></div>
                ) : (
                  <div className="divide-y dark:divide-gray-700 -mx-4">
                    {carrito.map((item, index) => (
                      <div key={index} className="px-4 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-800 dark:text-white truncate uppercase">{item.nombre}</p>
                          <p className="text-xs text-gray-500 font-bold">
                            {item.es_por_kg ? `${(item.cantidad * 1000).toFixed(0)}gr x $${item.precio_unitario}/kg` : `${item.cantidad} un. x $${item.precio_unitario}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => actualizarCantidad(index, item.cantidad - (item.es_por_kg ? 0.1 : 1))} className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg text-lg font-black">-</button>
                          <span className="w-10 text-center font-black">{item.es_por_kg ? (item.cantidad * 1000).toFixed(0) : item.cantidad}</span>
                          <button onClick={() => actualizarCantidad(index, item.cantidad + (item.es_por_kg ? 0.1 : 1))} className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg text-lg font-black">+</button>
                          <button onClick={() => quitarDelCarrito(index)} className="ml-2 text-red-500">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className={`space-y-4 ${mostrarVentas ? 'block' : 'hidden lg:block'}`}>
              <Card className="sticky top-16 hidden lg:block">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total de la Venta</p>
                <h3 className="text-5xl font-black text-primary mb-8">${total.toFixed(2)}</h3>
                <div className="space-y-3">
                  <Button variant="primary" className="w-full py-6 text-xl font-black rounded-2xl" onClick={() => setModalPago(true)} disabled={carrito.length === 0}>COBRAR (F2) 🚀</Button>
                  <Button variant="secondary" className="w-full font-bold text-xs" onClick={vaciarCarrito} disabled={carrito.length === 0}>BORRAR CARRITO</Button>
                </div>
              </Card>

              <Card>
                <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase italic mb-6">📄 Ventas de Hoy</h3>
                {ventas.length === 0 ? (
                  <p className="text-center py-10 opacity-30 text-xs font-black uppercase">Sin actividad</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto divide-y dark:divide-gray-700">
                    {ventas.map((venta) => (
                      <div key={venta.id} onClick={() => handleVerDetalle(venta.id)} className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg pr-2">
                        <div>
                          <p className="font-black text-lg">${venta.total.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{format(new Date(venta.fecha), 'HH:mm')} • {venta.metodo_pago}</p>
                        </div>
                        <span className="text-primary font-black text-xl">→</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* MODALES */}
      <Modal isOpen={modalVentaRapida} onClose={() => setModalVentaRapida(false)} title="⚡ Venta Rápida">
        <form onSubmit={handleVentaRapida} className="space-y-4">
          <Input label="Descripción *" value={nombreRapido} onChange={e => setNombreRapido(e.target.value)} required autoFocus />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio" type="number" step="0.01" value={precioRapido} onChange={e => setPrecioRapido(e.target.value)} required />
            <Input label="Cantidad" type="number" value={cantidadRapido} onChange={e => setCantidadRapido(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full py-4 text-xl font-black">AGREGAR AL CARRITO</Button>
        </form>
      </Modal>

      <Modal isOpen={modalPago} onClose={() => setModalPago(false)} title="💳 Cobro">
        <form onSubmit={handleProcesarPago} className="space-y-6">
          <div className="bg-primary/10 p-8 rounded-3xl text-center border-2 border-primary/20">
            <p className="text-5xl font-black text-primary">${total.toFixed(2)}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['efectivo', 'tarjeta', 'fiado'].map(m => (
              <button key={m} type="button" onClick={() => setMetodoPago(m)} className={`p-4 rounded-2xl border-4 font-black uppercase text-[10px] transition-colors ${metodoPago === m ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-300'}`}>
                {m === 'efectivo' ? '💵' : m === 'tarjeta' ? '💳' : '📝'}<br />{m === 'tarjeta' ? 'Transf' : m}
              </button>
            ))}
          </div>
          {metodoPago === 'fiado' && (
            <div className="space-y-3">
              <select value={clienteNombre} onChange={e => { setClienteNombre(e.target.value); setEsClienteNuevo(false); }} className="w-full p-4 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-2xl font-black border-none">
                <option value="">-- ELIGE CLIENTE --</option>
                {clientesFiados.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
              <Input placeholder="O escribe nombre nuevo..." value={esClienteNuevo ? clienteNombre : ''} onChange={e => { setClienteNombre(e.target.value); setEsClienteNuevo(true); }} />
            </div>
          )}
          <Button type="submit" className="w-full py-6 text-xl font-black" disabled={procesando || carrito.length === 0}>{procesando ? '⌛ PROCESANDO...' : 'CONFIRMAR ✅'}</Button>
        </form>
      </Modal>

      <Modal isOpen={modalCantidadKg} onClose={() => setModalCantidadKg(false)} title="⚖️ Peso">
        {productoKgSeleccionado && (
          <form onSubmit={handleConfirmarCantidadKg} className="space-y-6">
            <div className="text-center p-4 bg-primary/5 rounded-2xl">
              <h3 className="text-xl font-black text-primary uppercase">{productoKgSeleccionado.nombre}</h3>
            </div>
            <div className="flex items-center gap-4 justify-center">
              <Input type="number" value={cantidadKg} onChange={e => setCantidadKg(e.target.value)} placeholder="0" className="text-4xl text-center font-black w-32" required autoFocus />
              <span className="text-2xl font-black text-gray-300">GR.</span>
            </div>
            {cantidadKg > 0 && (
              <div className="p-4 bg-primary text-white rounded-2xl text-center">
                <p className="text-2xl font-black">${((parseFloat(cantidadKg) / 1000) * productoKgSeleccionado.precio).toFixed(2)}</p>
              </div>
            )}
            <Button type="submit" className="w-full py-5 text-xl font-black">AGREGAR ⚖️</Button>
          </form>
        )}
      </Modal>

      <DetalleVentaModal isOpen={modalDetalle} onClose={() => { setModalDetalle(false); setVentaSeleccionada(null); }} ventaId={ventaSeleccionada} />
      {mostrarScanner && <ScannerBarcode onScan={handleScanSuccess} onClose={() => setMostrarScanner(false)} />}
      <SectionGuide isOpen={modalAyuda} onClose={() => setModalAyuda(false)} title="Punto de Venta" steps={pasosAyudaPuntoVenta} />

      <MobileActions actions={[
        { label: 'Vaciar', icon: '🗑️', onClick: vaciarCarrito, variant: 'danger' },
        { label: 'Cobrar', icon: '💳', onClick: () => carrito.length > 0 && setModalPago(true), variant: 'primary' }
      ]} />
    </Layout>
  )
}