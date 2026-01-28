// ============================================
// ¿QUÉ HACE ESTO?
// Página completa de inventario con:
// - Búsqueda instantánea
// - Tarjetas de productos
// - Alertas de stock bajo
// - Botones +1, +5, +10 para agregar stock
// - Modal para agregar nuevos productos
// ============================================

import React, { useState, useEffect } from 'react'
import { useProductosStore } from '../store/productosStore'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Input } from '../components/common/Input'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import toast from 'react-hot-toast'
import { Layout } from '../components/layout/Layout'
import { usePermisos } from '../hooks/usePermisos'
import { exportarInventario } from '../utils/exportInventario'

export const Inventario = () => {
  const { user } = useAuthStore()
  const { puedeModificarInventario, puedeEliminarProductos } = usePermisos()
  const { 
  productos, 
  cargando, 
  cargarProductos, 
  buscarProductos, 
  agregarProducto,
  actualizarProducto,
  agregarStock,
  desactivarProducto      // ← AGREGAR ESTA LÍNEA
} = useProductosStore()
  
  const [modalAgregar, setModalAgregar] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
const [productoEditar, setProductoEditar] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  
  // Form
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [stockMinimo, setStockMinimo] = useState('5')
  const [codigoBarras, setCodigoBarras] = useState('')
  const [esPorKg, setEsPorKg] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('todos')

  // Resetear stock cuando se marca KG
  useEffect(() => {
    if (esPorKg) {
      setStock('0')
      setStockMinimo('0')
    }
  }, [esPorKg])

  // Cargar productos al montar
 useEffect(() => {
  if (user?.negocio_id) {
    cargarProductos(user.negocio_id)
  }
}, [user])

  // Búsqueda en tiempo real
  const handleBusqueda = (valor) => {
  setBusqueda(valor)
  if (valor.trim()) {
    buscarProductos(user.negocio_id, valor)
  } else {
    cargarProductos(user.negocio_id)
  }
}

  // Agregar producto
 const handleAgregar = async (e) => {
  e.preventDefault()
  try {
    await agregarProducto(user.negocio_id, {
      nombre,
      precio: parseFloat(precio),
      stock_actual: esPorKg ? 0 : parseInt(stock),
      stock_minimo: esPorKg ? 0 : parseInt(stockMinimo),
      codigo_barras: codigoBarras || null,
      es_por_kg: esPorKg
    })
      toast.success('✅ Producto agregado')
      setModalAgregar(false)
      // Limpiar form
      setNombre('')
      setPrecio('')
      setStock('')
      setStockMinimo('5')
      setCodigoBarras('')
      setEsPorKg(false)
    } catch (error) {
      toast.error(error.message || 'Error al agregar producto')
    }
  }
const handleEditar = async (e) => {
  e.preventDefault()
  try {
    await actualizarProducto(productoEditar.id, {
      nombre,
      precio: parseFloat(precio),
      stock_actual: parseInt(stock),
      stock_minimo: parseInt(stockMinimo)
    })
    toast.success('Producto actualizado')
    setModalEditar(false)
    setProductoEditar(null)
    // Limpiar form
    setNombre('')
    setPrecio('')
    setStock('')
    setStockMinimo('5')
  } catch (error) {
    toast.error(error.message)
  }
}

const abrirModalEditar = (producto) => {
  setProductoEditar(producto)
  setNombre(producto.nombre)
  setPrecio(producto.precio.toString())
  setStock(producto.stock_actual.toString())
  setStockMinimo(producto.stock_minimo.toString())
  setModalEditar(true)
}

const handleEliminar = async (id) => {
  if (!window.confirm('¿Estás seguro de eliminar este producto?')) return

  try {
    await desactivarProducto(id)
    toast.success('Producto eliminado')
  } catch (error) {
    toast.error('Error al eliminar producto')
  }
}
  // Agregar stock rápido
  const handleAgregarStock = async (id, cantidad) => {
    try {
      await agregarStock(id, cantidad)
      toast.success(`✅ +${cantidad} agregado al stock`)
    } catch (error) {
      toast.error('Error al actualizar stock')
    }
 }

  // Exportar inventario a Excel
  const handleExportar = () => {
    try {
      exportarInventario(productos)
      toast.success('✅ Inventario exportado correctamente')
    } catch (error) {
      toast.error('Error al exportar inventario')
      console.error(error)
    }
  }

  return (
  <Layout>
    <div className="max-w-7xl mx-auto px-4 py-8">
{/* Header */}
<div className="mb-6 flex items-center justify-between">
  <div>
    <h1 className="text-4xl font-bold text-primary mb-2">
      📦 Inventario
    </h1>
    <p className="text-gray-600">
      Gestiona tus productos
    </p>
  </div>
  <div className="flex gap-3">
    <Button 
      variant="secondary"
      onClick={handleExportar}
      disabled={productos.length === 0}
    >
      📥 Exportar Excel
    </Button>
    {puedeModificarInventario && (
      <Button onClick={() => setModalAgregar(true)}>
        + Agregar Producto
      </Button>
    )}
  </div>
</div>

{/* Búsqueda */}
<div className="mb-6">
  <Input
    placeholder="🔍 Buscar productos..."
    value={busqueda}
    onChange={e => handleBusqueda(e.target.value)}
  />
</div>

{/* Filtros */}
<div className="flex gap-2 mb-6">
  <button
    onClick={() => setFiltroTipo('todos')}
    className={`px-4 py-2 rounded-lg ${filtroTipo === 'todos' ? 'bg-primary text-white' : 'bg-gray-200'}`}
  >
    Todos ({productos.length})
  </button>
  <button
    onClick={() => setFiltroTipo('unidad')}
    className={`px-4 py-2 rounded-lg ${filtroTipo === 'unidad' ? 'bg-primary text-white' : 'bg-gray-200'}`}
  >
    Por Unidad ({productos.filter(p => !p.es_por_kg).length})
  </button>
  <button
    onClick={() => setFiltroTipo('kg')}
    className={`px-4 py-2 rounded-lg ${filtroTipo === 'kg' ? 'bg-primary text-white' : 'bg-gray-200'}`}
  >
    Por KG ({productos.filter(p => p.es_por_kg).length})
  </button>
</div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {cargando ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Cargando productos...</p>
          </div>
        ) : productos.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No hay productos
            </h2>
            <p className="text-gray-600 mb-6">
              {busqueda ? 'No se encontraron productos con ese nombre' : '¡Agrega tu primer producto!'}
            </p>
            {puedeModificarInventario && (
                
              <Button onClick={() => setModalAgregar(true)}>
                + Agregar Primer Producto
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.filter(p => {
              if (filtroTipo === 'kg') return p.es_por_kg
              if (filtroTipo === 'unidad') return !p.es_por_kg
              return true
            }).map(producto => {
              const stockBajo = producto.stock_actual <= producto.stock_minimo
              return (
                <Card 
                  key={producto.id} 
                  className="hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">
                        {producto.nombre}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      {producto.es_por_kg && (
                        <Badge variant="info">⚖️ KG</Badge>
                      )}
                      {stockBajo && (
                        <Badge variant="danger">⚠ Stock bajo</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-3xl font-bold text-primary">
                      ${producto.precio.toFixed(2)}
                    </p>
                    <p className={`text-lg font-semibold ${stockBajo ? 'text-danger' : 'text-gray-700'}`}>
                      Stock: {producto.stock_actual} unidades
                    </p>
                    <p className="text-sm text-gray-500">
                      Mínimo: {producto.stock_minimo}
                    </p>
                    {producto.codigo_barras && (
                      <p className="text-xs text-gray-400">
                        Código: {producto.codigo_barras}
                      </p>
                    )}
                  </div>

                  {/* Botones de acción */}
<div className="space-y-2">
  {/* Botones agregar stock */}
  <div className="flex gap-2">
    <Button
      variant="secondary"
      className="flex-1 text-sm py-2"
      onClick={() => handleAgregarStock(producto.id, 1)}
    >
      +1
    </Button>
    <Button
      variant="secondary"
      className="flex-1 text-sm py-2"
      onClick={() => handleAgregarStock(producto.id, 5)}
    >
      +5
    </Button>
    <Button
      variant="secondary"
      className="flex-1 text-sm py-2"
      onClick={() => handleAgregarStock(producto.id, 10)}
    >
      +10
    </Button>
  </div>

  {/* Botones admin */}
  {puedeModificarInventario && (
    <div className="flex gap-2">
      <Button
        variant="primary"
        className="flex-1 text-sm py-2"
        onClick={() => abrirModalEditar(producto)}
      >
        ✏️ Editar
      </Button>
      {puedeEliminarProductos && (
        <Button
          variant="danger"
          className="flex-1 text-sm py-2"
          onClick={() => handleEliminar(producto.id)}
        >
          🗑️ Eliminar
        </Button>
      )}
    </div>
  )}
</div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Agregar Producto */}
      <Modal
        isOpen={modalAgregar}
        onClose={() => setModalAgregar(false)}
        title="Agregar Producto"
      >
        <form onSubmit={handleAgregar} className="space-y-4">
          <Input
            label="Nombre del producto *"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Coca-Cola 500ml"
            required
          />
          <Input
            label="Precio *"
            type="number"
            step="0.01"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            placeholder="0.00"
            required
          />
          <Input
            label="Stock actual *"
            type="number"
            value={stock}
            onChange={e => setStock(e.target.value)}
            placeholder="0"
            required
            disabled={esPorKg}
          />
          <Input
            label="Stock mínimo (para alertas)"
            type="number"
            value={stockMinimo}
            onChange={e => setStockMinimo(e.target.value)}
            placeholder="5"
            disabled={esPorKg}
          />
          <Input
            label="Código de barras (opcional)"
            value={codigoBarras}
            onChange={e => setCodigoBarras(e.target.value)}
            placeholder="123456789"
          />
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="esPorKg"
              checked={esPorKg}
              onChange={(e) => setEsPorKg(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="esPorKg" className="cursor-pointer">
              <span className="font-semibold">📦 Producto por KG</span>
              <p className="text-sm text-gray-600">
                Pan, milanesas, verduras, chorizos, etc.
              </p>
            </label>
          </div>
          <Button type="submit" className="w-full">
            Agregar Producto
          </Button>
        </form>
     </Modal>

{/* Modal Editar */}
<Modal
  isOpen={modalEditar}
  onClose={() => {
    setModalEditar(false)
    setProductoEditar(null)
  }}
  title="Editar Producto"
>
  <form onSubmit={handleEditar} className="space-y-4">
    <Input
      label="Nombre del producto"
      value={nombre}
      onChange={e => setNombre(e.target.value)}
      placeholder="Ej: Coca-Cola 500ml"
      required
    />
    <Input
      label="Precio"
      type="number"
      step="0.01"
      value={precio}
      onChange={e => setPrecio(e.target.value)}
      placeholder="0.00"
      required
    />
    <Input
      label="Stock actual"
      type="number"
      value={stock}
      onChange={e => setStock(e.target.value)}
      placeholder="0"
      required
    />
    <Input
      label="Stock mínimo (para alertas)"
      type="number"
      value={stockMinimo}
      onChange={e => setStockMinimo(e.target.value)}
      placeholder="5"
    />
    <Button type="submit" className="w-full" variant="success">
      Guardar Cambios
    </Button>
  </form>
</Modal>
    </div>
    </Layout>
  )
}