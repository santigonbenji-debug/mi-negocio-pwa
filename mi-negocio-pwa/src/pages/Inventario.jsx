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

export const Inventario = () => {
  const { user, userData } = useAuthStore()
  const { 
    productos, 
    cargando, 
    cargarProductos, 
    buscarProductos, 
    agregarProducto, 
    agregarStock 
  } = useProductosStore()
  
  const [modalAgregar, setModalAgregar] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  
  // Form
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [stockMinimo, setStockMinimo] = useState('5')
  const [codigoBarras, setCodigoBarras] = useState('')

  // Cargar productos al montar
  useEffect(() => {
    if (user?.id) {
      // Por ahora usamos el user.id como negocio_id (en la próxima etapa crearemos la tabla de negocios)
      cargarProductos(userData?.negocio_id)
    }
  }, [user])

  // Búsqueda en tiempo real
  const handleBusqueda = (valor) => {
    setBusqueda(valor)
    if (valor.trim()) {
      buscarProductos(userData.negocio_id, valor)
    } else {
      cargarProductos(userData.negocio_id)
    }
  }

  // Agregar producto
  const handleAgregar = async (e) => {
    e.preventDefault()
    try {
      await agregarProducto(userData.negocio_id, {
        nombre,
        precio: parseFloat(precio),
        stock_actual: parseInt(stock),
        stock_minimo: parseInt(stockMinimo),
        codigo_barras: codigoBarras || null
      })
      toast.success('✅ Producto agregado')
      setModalAgregar(false)
      // Limpiar form
      setNombre('')
      setPrecio('')
      setStock('')
      setStockMinimo('5')
      setCodigoBarras('')
    } catch (error) {
      toast.error(error.message || 'Error al agregar producto')
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-primary">📦 Inventario</h1>
            <Button 
              variant="danger" 
              onClick={() => useAuthStore.getState().logout()}
            >
              Cerrar Sesión
            </Button>
          </div>
          
          <div className="flex gap-4">
            <Input
              placeholder="🔍 Buscar productos..."
              value={busqueda}
              onChange={e => handleBusqueda(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => setModalAgregar(true)}>
              + Agregar Producto
            </Button>
          </div>
        </div>
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
            {!busqueda && (
              <Button onClick={() => setModalAgregar(true)}>
                + Agregar Primer Producto
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map(producto => {
              const stockBajo = producto.stock_actual <= producto.stock_minimo
              return (
                <Card 
                  key={producto.id} 
                  className="hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-800">
                      {producto.nombre}
                    </h3>
                    {stockBajo && (
                      <Badge variant="danger">⚠ Stock bajo</Badge>
                    )}
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

                  {/* Botones rápidos */}
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
          />
          <Input
            label="Stock mínimo (para alertas)"
            type="number"
            value={stockMinimo}
            onChange={e => setStockMinimo(e.target.value)}
            placeholder="5"
          />
          <Input
            label="Código de barras (opcional)"
            value={codigoBarras}
            onChange={e => setCodigoBarras(e.target.value)}
            placeholder="123456789"
          />
          <Button type="submit" className="w-full">
            Agregar Producto
          </Button>
        </form>
      </Modal>
    </div>
  )
}