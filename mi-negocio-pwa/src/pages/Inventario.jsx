// ============================================
// ¿QUÉ HACE ESTO?
// Página completa de inventario con:
// - Búsqueda instantánea y Selección Múltiple
// - Tarjetas de productos con Checkboxes
// - Actualización Masiva de Precios (Monto o %)
// - Alertas de stock bajo
// - Gestión de Categorías
// ============================================

import React, { useState, useEffect } from 'react'
import { useProductosStore } from '../store/productosStore'
import { useCategoriasStore } from '../store/categoriasStore'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Input } from '../components/common/Input'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import { HelpButton } from '../components/common/HelpButton'
import { SectionGuide } from '../components/common/SectionGuide'
import toast from 'react-hot-toast'
import { Layout } from '../components/layout/Layout'
import { usePermisos } from '../hooks/usePermisos'
import { exportarInventario } from '../utils/exportInventario'
import { ScannerBarcode } from '../components/common/ScannerBarcode'
import { MobileActions } from '../components/common/MobileActions'

// Componente interno para el contenido de categorías
const CategoriesContent = ({
  nombreCategoria,
  setNombreCategoria,
  colorCategoria,
  setColorCategoria,
  categoriaEditar,
  setCategoriaEditar,
  handleSubmit,
  categorias,
  filtroTipo,
  setFiltroTipo,
  handleDelete,
  handleEdit
}) => (
  <div className="space-y-4">
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        placeholder="Nombre de categoría"
        value={nombreCategoria}
        onChange={e => setNombreCategoria(e.target.value)}
        required
      />
      <div className="flex gap-2 items-center">
        <label className="text-sm text-gray-600 dark:text-gray-400">Color:</label>
        <input
          type="color"
          value={colorCategoria}
          onChange={e => setColorCategoria(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {categoriaEditar ? 'Actualizar' : 'Crear'}
        </Button>
        {categoriaEditar && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setCategoriaEditar(null)
              setNombreCategoria('')
              setColorCategoria('#6B7280')
            }}
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {categorias.map(cat => (
        <div
          key={cat.id}
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${filtroTipo === cat.id ? 'ring-2 ring-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          onClick={() => setFiltroTipo(filtroTipo === cat.id ? 'todos' : cat.id)}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            <span className="font-medium dark:text-gray-200">{cat.nombre}</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleEdit(cat); }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              ✏️
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
      {categorias.length === 0 && (
        <p className="text-center text-gray-500 py-4">No hay categorías creadas</p>
      )}
    </div>
  </div>
)

export const Inventario = () => {
  const { user } = useAuthStore()
  const { puedeModificarInventario, puedeEliminarProductos } = usePermisos()
  const {
    categorias,
    cargarCategorias,
    agregarCategoria,
    actualizarCategoria,
    eliminarCategoria
  } = useCategoriasStore()
  const {
    productos,
    cargando,
    cargarProductos,
    buscarProductos,
    agregarProducto,
    actualizarProducto,
    actualizarProductosMasivo,
    agregarStock,
    desactivarProducto
  } = useProductosStore()

  // Estados UI
  const [modalAgregar, setModalAgregar] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalMasivo, setModalMasivo] = useState(false)
  const [modalCategoria, setModalCategoria] = useState(false)
  const [modalAyuda, setModalAyuda] = useState(false)

  const pasosAyuda = [
    { title: '➕ Agregar Productos', description: 'Usa el botón "+ Nuevo" para cargar productos. No olvides poner el "Precio Costo" para que el sistema calcule tus ganancias reales.' },
    { title: '🏷️ Gestionar Categorías', description: 'Crea categorías (como "Bebidas", "Limpieza") para organizar tu lista y ver reportes detallados.' },
    { title: '🚀 Aumento Masivo', description: 'Selecciona varios productos y usa el botón del cohete para subir precios a todos juntos por porcentaje o monto fijo.' },
    { title: '📷 Escáner', description: 'Usa la cámara para buscar productos rápidamente por su código de barras.' }
  ]

  // Selección
  const [seleccionados, setSeleccionados] = useState([])
  const [tipoAumento, setTipoAumento] = useState('monto') // 'monto' o 'porcentaje'
  const [valorAumento, setValorAumento] = useState('')

  // Form Producto
  const [productoEditar, setProductoEditar] = useState(null)
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [precioCosto, setPrecioCosto] = useState('')
  const [stock, setStock] = useState('')
  const [stockMinimo, setStockMinimo] = useState('5')
  const [codigoBarras, setCodigoBarras] = useState('')
  const [esPorKg, setEsPorKg] = useState(false)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [nombreCategoria, setNombreCategoria] = useState('')
  const [colorCategoria, setColorCategoria] = useState('#6B7280')
  const [categoriaEditar, setCategoriaEditar] = useState(null)

  // Scanner
  const [mostrarScanner, setMostrarScanner] = useState(false)
  const [destinoScanner, setDestinoScanner] = useState('busqueda') // 'busqueda' o 'formulario'

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.negocio_id) {
      cargarProductos(user.negocio_id)
      cargarCategorias(user.negocio_id)
    }
  }, [user])

  // Resetear stock cuando se marca KG
  useEffect(() => {
    if (esPorKg) {
      setStock('0')
      setStockMinimo('0')
    }
  }, [esPorKg])

  // Handlers
  const handleBusqueda = (valor) => {
    setBusqueda(valor)
    if (valor.trim()) {
      buscarProductos(user.negocio_id, valor)
    } else {
      cargarProductos(user.negocio_id)
    }
  }

  const handleScanSuccess = (codigo) => {
    if (destinoScanner === 'busqueda') {
      handleBusqueda(codigo)
    } else {
      setCodigoBarras(codigo)
    }
    setMostrarScanner(false)
  }

  const handleAgregar = async (e) => {
    e.preventDefault()
    try {
      await agregarProducto(user.negocio_id, {
        nombre,
        precio: parseFloat(precio),
        precio_costo: parseFloat(precioCosto) || 0,
        stock_actual: esPorKg ? 0 : parseInt(stock),
        stock_minimo: esPorKg ? 0 : parseInt(stockMinimo),
        codigo_barras: codigoBarras || null,
        es_por_kg: esPorKg,
        categoria_id: categoriaSeleccionada || null
      })
      toast.success('✅ Producto agregado')
      setModalAgregar(false)
      resetForm()
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
        precio_costo: parseFloat(precioCosto) || 0,
        stock_actual: parseFloat(stock), // Puede ser float si es KG? No, stock es int usualmente pero depende del negocio
        stock_minimo: parseInt(stockMinimo),
        categoria_id: categoriaSeleccionada || null
      })
      toast.success('Producto actualizado')
      setModalEditar(false)
      resetForm()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const abrirModalEditar = (producto) => {
    setProductoEditar(producto)
    setNombre(producto.nombre)
    setPrecio(producto.precio.toString())
    setPrecioCosto(producto.precio_costo?.toString() || '0')
    setStock(producto.stock_actual.toString())
    setStockMinimo(producto.stock_minimo.toString())
    setCategoriaSeleccionada(producto.categoria_id || '')
    setModalEditar(true)
  }

  const resetForm = () => {
    setNombre('')
    setPrecio('')
    setPrecioCosto('')
    setStock('')
    setStockMinimo('5')
    setCodigoBarras('')
    setEsPorKg(false)
    setCategoriaSeleccionada('')
    setProductoEditar(null)
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

  const handleAgregarStock = async (id, cantidad) => {
    try {
      await agregarStock(id, cantidad)
      toast.success(`✅ +${cantidad} agregado`)
    } catch (error) {
      toast.error('Error al actualizar stock')
    }
  }

  // Selección
  const toggleSeleccion = (id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const seleccionarTodosVisibles = (filtrados) => {
    if (seleccionados.length === filtrados.length) {
      setSeleccionados([])
    } else {
      setSeleccionados(filtrados.map(p => p.id))
    }
  }

  const handleActualizacionMasiva = async () => {
    if (!valorAumento || seleccionados.length === 0) return
    const monto = parseFloat(valorAumento)
    if (isNaN(monto)) return

    try {
      const promesas = seleccionados.map(id => {
        const p = productos.find(prod => prod.id === id)
        let nuevoPrecio = p.precio
        if (tipoAumento === 'monto') {
          nuevoPrecio += monto
        } else {
          nuevoPrecio *= (1 + monto / 100)
        }
        return actualizarProducto(id, { ...p, precio: nuevoPrecio })
      })

      await Promise.all(promesas)
      toast.success(`✅ ${seleccionados.length} destacados actualizados`)
      setModalMasivo(false)
      setSeleccionados([])
      setValorAumento('')
    } catch (error) {
      toast.error('Error en actualización masiva')
    }
  }

  const productosFiltrados = productos.filter(p => {
    if (filtroTipo === 'kg') return p.es_por_kg
    if (filtroTipo === 'unidad') return !p.es_por_kg
    if (filtroTipo === 'sin-categoria') return !p.categoria_id
    if (filtroTipo !== 'todos') return p.categoria_id === filtroTipo
    return true
  })

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-primary dark:text-primary-light">📦 Inventario</h1>
              <HelpButton onClick={() => setModalAyuda(true)} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium italic">Mira qué productos tienes y actualiza sus precios al instante.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {seleccionados.length > 0 && (
              <Button variant="primary" onClick={() => setModalMasivo(true)} className="animate-bounce shadow-xl">
                🚀 Aumento Masivo ({seleccionados.length})
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                setDestinoScanner('busqueda')
                setMostrarScanner(true)
              }}
              className="flex items-center gap-2"
            >
              📷 Escanear
            </Button>
            <Button variant="secondary" onClick={() => exportarInventario(productos)} disabled={productos.length === 0}>
              📥 Exportar
            </Button>
            {puedeModificarInventario && (
              <>
                <Button variant="secondary" onClick={() => setModalCategoria(true)} className="flex-1 sm:flex-none">🏷️ Cat.</Button>
                <Button onClick={() => setModalAgregar(true)} className="flex-1 sm:flex-none whitespace-nowrap">+ Nuevo</Button>
              </>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="🔍 Buscar productos..."
              value={busqueda}
              onChange={e => handleBusqueda(e.target.value)}
              className="w-full"
            />
          </div>
          {productosFiltrados.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => seleccionarTodosVisibles(productosFiltrados)}
              className="whitespace-nowrap w-full sm:w-auto"
            >
              {seleccionados.length === productosFiltrados.length ? 'Desmarcar todos' : 'Seleccionar todos'}
            </Button>
          )}
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setFiltroTipo('todos')} className={`px-6 py-2 rounded-full whitespace-nowrap transition-all font-semibold border-2 ${filtroTipo === 'todos' ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700'}`}>
            Todos ({productos.length})
          </button>
          <button onClick={() => setFiltroTipo('unidad')} className={`px-6 py-2 rounded-full whitespace-nowrap transition-all font-semibold border-2 ${filtroTipo === 'unidad' ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700'}`}>
            📦 Unidad ({productos.filter(p => !p.es_por_kg).length})
          </button>
          <button onClick={() => setFiltroTipo('kg')} className={`px-6 py-2 rounded-full whitespace-nowrap transition-all font-semibold border-2 ${filtroTipo === 'kg' ? 'bg-orange-500 text-white border-orange-500 shadow-lg scale-105' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700'}`}>
            ⚖️ KG ({productos.filter(p => p.es_por_kg).length})
          </button>
        </div>

        {/* Dropdown de categorías para mobile */}
        {categorias.length > 0 && (
          <div className="mb-4 lg:hidden">
            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className="w-full p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-semibold"
            >
              <option value="todos">🏷️ Todas las categorías</option>
              <option value="sin-categoria">📦 Sin categoría</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre} ({productos.filter(p => p.categoria_id === cat.id).length})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {cargando ? (
              <div className="text-center py-12"><p className="text-xl text-gray-600">Cargando...</p></div>
            ) : productosFiltrados.length === 0 ? (
              <Card className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-2xl font-bold dark:text-gray-100 mb-2">No hay productos</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{busqueda ? 'No se encontró nada' : '¡Crea el primero!'}</p>
                {puedeModificarInventario && <Button onClick={() => setModalAgregar(true)}>+ Agregar Producto</Button>}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {productosFiltrados.map(p => {
                  const stockBajo = !p.es_por_kg && p.stock_actual <= p.stock_minimo
                  const seleccionado = seleccionados.includes(p.id)
                  return (
                    <Card key={p.id} className={`hover:shadow-xl transition-all relative cursor-pointer ${seleccionado ? 'ring-4 ring-primary bg-primary/5' : ''}`} onClick={() => toggleSeleccion(p.id)}>
                      <input type="checkbox" checked={seleccionado} readOnly className="absolute top-4 right-4 w-6 h-6 accent-primary rounded-lg" />
                      <div className="mb-3 pr-8">
                        <h3 className="font-extrabold text-gray-800 dark:text-white truncate">{p.nombre}</h3>
                        {p.categorias && <Badge style={{ backgroundColor: p.categorias.color, color: '#fff' }}>{p.categorias.nombre}</Badge>}
                      </div>
                      <div className="mb-4">
                        <p className="text-3xl font-black text-primary">${p.precio.toFixed(2)}</p>
                        <p className={`font-bold mt-1 ${stockBajo ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>Stock: {p.stock_actual} {p.es_por_kg ? 'kg' : 'un.'}</p>
                      </div>
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <Button variant="secondary" className="flex-1 py-1" onClick={() => handleAgregarStock(p.id, 1)}>+1</Button>
                        <Button variant="secondary" className="flex-1 py-1" onClick={() => handleAgregarStock(p.id, 5)}>+5</Button>
                        <Button variant="primary" className="p-2" onClick={() => abrirModalEditar(p)}>✏️</Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Sidebar Desktop */}
            <Card className="sticky top-24 hidden lg:block">
              <h3 className="text-xl font-bold mb-1 dark:text-gray-100">🏷️ Categorías</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-4">Organiza tus productos</p>
              <CategoriesContent
                nombreCategoria={nombreCategoria}
                setNombreCategoria={setNombreCategoria}
                colorCategoria={colorCategoria}
                setColorCategoria={setColorCategoria}
                categoriaEditar={categoriaEditar}
                setCategoriaEditar={setCategoriaEditar}
                handleSubmit={async (e) => {
                  e.preventDefault()
                  if (categoriaEditar) await actualizarCategoria(categoriaEditar.id, { nombre: nombreCategoria, color: colorCategoria })
                  else await agregarCategoria(user.negocio_id, { nombre: nombreCategoria, color: colorCategoria })
                  setNombreCategoria(''); setCategoriaEditar(null);
                  toast.success(categoriaEditar ? 'Categoría actualizada' : 'Categoría creada')
                }}
                categorias={categorias}
                filtroTipo={filtroTipo}
                setFiltroTipo={setFiltroTipo}
                handleDelete={async (id) => {
                  if (window.confirm('¿Eliminar categoría?')) {
                    await eliminarCategoria(id)
                    toast.success('Categoría eliminada')
                  }
                }}
                handleEdit={(cat) => {
                  setCategoriaEditar(cat)
                  setNombreCategoria(cat.nombre)
                  setColorCategoria(cat.color)
                }}
              />
            </Card>

            {/* Modal Categorías Mobile */}
            <Modal isOpen={modalCategoria} onClose={() => setModalCategoria(false)} title="🏷️ Gestionar Categorías">
              <CategoriesContent
                nombreCategoria={nombreCategoria}
                setNombreCategoria={setNombreCategoria}
                colorCategoria={colorCategoria}
                setColorCategoria={setColorCategoria}
                categoriaEditar={categoriaEditar}
                setCategoriaEditar={setCategoriaEditar}
                handleSubmit={async (e) => {
                  e.preventDefault()
                  if (categoriaEditar) await actualizarCategoria(categoriaEditar.id, { nombre: nombreCategoria, color: colorCategoria })
                  else await agregarCategoria(user.negocio_id, { nombre: nombreCategoria, color: colorCategoria })
                  setNombreCategoria(''); setCategoriaEditar(null);
                  setModalCategoria(false)
                  toast.success(categoriaEditar ? 'Categoría actualizada' : 'Categoría creada')
                }}
                categorias={categorias}
                filtroTipo={filtroTipo}
                setFiltroTipo={setFiltroTipo}
                handleDelete={async (id) => {
                  if (window.confirm('¿Eliminar categoría?')) {
                    await eliminarCategoria(id)
                    toast.success('Categoría eliminada')
                  }
                }}
                handleEdit={(cat) => {
                  setCategoriaEditar(cat)
                  setNombreCategoria(cat.nombre)
                  setColorCategoria(cat.color)
                }}
              />
            </Modal>
          </div>
        </div>

        {/* Modal Masivo */}
        <Modal isOpen={modalMasivo} onClose={() => setModalMasivo(false)} title="🚀 Aumento Masivo">
          <div className="space-y-5">
            <p className="font-bold text-center dark:text-gray-100">Actualizando {seleccionados.length} productos.</p>
            <div className="flex gap-2">
              <button onClick={() => setTipoAumento('monto')} className={`flex-1 p-3 rounded-xl font-bold transition-colors ${tipoAumento === 'monto' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200'}`}>$ Fijo</button>
              <button onClick={() => setTipoAumento('porcentaje')} className={`flex-1 p-3 rounded-xl font-bold transition-colors ${tipoAumento === 'porcentaje' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200'}`}>% Porc.</button>
            </div>
            <Input type="number" label="Cuánto aumentar" value={valorAumento} onChange={e => setValorAumento(e.target.value)} placeholder="0" />
            <Button className="w-full h-14 text-lg" onClick={handleActualizacionMasiva}>Confirmar Cambio</Button>
          </div>
        </Modal>

        {/* Modal Agregar/Editar */}
        <Modal isOpen={modalAgregar || modalEditar} onClose={() => { setModalAgregar(false); setModalEditar(false); resetForm(); }} title={modalEditar ? "Editar Producto" : "Nuevo Producto"}>
          <form onSubmit={modalEditar ? handleEditar : handleAgregar} className="space-y-4">
            <Input label="Nombre *" value={nombre} onChange={e => setNombre(e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Precio Venta *" type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} required />
              <Input label="Precio Costo" type="number" step="0.01" value={precioCosto} onChange={e => setPrecioCosto(e.target.value)} />
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Código de Barras"
                  value={codigoBarras}
                  onChange={e => setCodigoBarras(e.target.value)}
                  placeholder="Escanea o escribe el código"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="mb-1"
                onClick={() => {
                  setDestinoScanner('formulario')
                  setMostrarScanner(true)
                }}
              >
                📷
              </Button>
            </div>
            <Input label="Stock *" type="number" value={stock} onChange={e => setStock(e.target.value)} disabled={esPorKg && !modalEditar} required />
            <select value={categoriaSeleccionada} onChange={e => setCategoriaSeleccionada(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 rounded-xl border-2 border-gray-200 dark:border-gray-600">
              <option value="">Sin categoría</option>
              {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
            </select>
            {!modalEditar && (
              <div className="flex gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <input type="checkbox" checked={esPorKg} onChange={e => setEsPorKg(e.target.checked)} className="accent-primary" />
                <label className="dark:text-gray-200">Es producto por KG</label>
              </div>
            )}
            <Button type="submit" className="w-full">{modalEditar ? 'Guardar' : 'Crear'}</Button>
          </form>
        </Modal>
      </div>

      {mostrarScanner && (
        <ScannerBarcode
          onScan={handleScanSuccess}
          onClose={() => setMostrarScanner(false)}
        />
      )}

      <SectionGuide
        isOpen={modalAyuda}
        onClose={() => setModalAyuda(false)}
        title="Inventario"
        steps={pasosAyuda}
      />

      <MobileActions
        actions={[
          {
            label: 'Cat.',
            icon: '🏷️',
            onClick: () => setModalCategoria(true),
            variant: 'secondary'
          },
          {
            label: 'Escanear',
            icon: '📷',
            onClick: () => { setDestinoScanner('busqueda'); setMostrarScanner(true); },
            variant: 'secondary'
          },
          {
            label: 'Nuevo',
            icon: '➕',
            onClick: () => setModalAgregar(true),
            variant: 'primary'
          }
        ]}
      />
    </Layout>
  )
}