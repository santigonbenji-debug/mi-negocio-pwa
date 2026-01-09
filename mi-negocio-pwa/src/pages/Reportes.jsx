// ============================================
// ¿QUÉ HACE ESTO?
// Página de reportes históricos con filtros por fecha
//
// PESTAÑAS:
// 1. Cajas - Historial completo de cajas
// 2. Ventas - Historial de ventas con filtros
// 3. Análisis - Gráficos y tendencias
// ============================================

import React, { useEffect } from 'react'
import { useReportesStore } from '../store/reportesStore'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { Modal } from '../components/common/Modal'
import { DateFilters } from '../components/common/DateFilters'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const Reportes = () => {
  const { userData } = useAuthStore()
  const {
    fechaInicio,
    fechaFin,
    rangoActivo,
    pestanaActiva,
    cajas,
    movimientosCajaSeleccionada,
    cajaSeleccionada,
    ventas,
    totales,
    productosMasVendidos,
    ventasPorDia,
    cargando,
    filtroMetodoPago,
    setPestana,
    setRangoRapido,
    setFechasPersonalizadas,
    cargarCajas,
    seleccionarCaja,
    cerrarDetalleCaja,
    cargarVentas,
    setFiltroMetodoPago,
    cargarAnalisis
  } = useReportesStore()

  // Cargar datos al cambiar pestaña o fechas
  useEffect(() => {
    if (!userData?.negocio_id) return

    if (pestanaActiva === 'cajas') {
      cargarCajas(userData.negocio_id)
    } else if (pestanaActiva === 'ventas') {
      cargarVentas(userData.negocio_id)
    } else if (pestanaActiva === 'analisis') {
      cargarAnalisis(userData.negocio_id)
    }
  }, [userData, pestanaActiva])

  const handleAplicarFiltros = () => {
    if (!userData?.negocio_id) return

    if (pestanaActiva === 'cajas') {
      cargarCajas(userData.negocio_id)
    } else if (pestanaActiva === 'ventas') {
      cargarVentas(userData.negocio_id)
    } else if (pestanaActiva === 'analisis') {
      cargarAnalisis(userData.negocio_id)
    }
  }

  const pestanas = [
    { id: 'cajas', label: '💰 Cajas', icono: '💰' },
    { id: 'ventas', label: '🛒 Ventas', icono: '🛒' },
    { id: 'analisis', label: '📊 Análisis', icono: '📊' }
  ]

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            📈 Reportes Históricos
          </h1>
          <p className="text-gray-600">
            Consulta el historial completo de tu negocio
          </p>
        </div>

        {/* Filtros de fecha */}
        <DateFilters
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          rangoActivo={rangoActivo}
          onRangoRapido={setRangoRapido}
          onFechasPersonalizadas={setFechasPersonalizadas}
          onAplicar={handleAplicarFiltros}
        />

        {/* Pestañas */}
        <div className="flex space-x-2 mb-6 border-b-2 border-gray-200">
          {pestanas.map(pestana => (
            <button
              key={pestana.id}
              onClick={() => setPestana(pestana.id)}
              className={`
                px-6 py-3 font-semibold transition-all
                ${pestanaActiva === pestana.id
                  ? 'border-b-4 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-800'
                }
              `}
            >
              {pestana.label}
            </button>
          ))}
        </div>

        {/* Contenido según pestaña */}
        {cargando ? (
          <Card className="text-center py-12">
            <p className="text-xl text-gray-600">Cargando datos...</p>
          </Card>
        ) : (
          <>
            {/* PESTAÑA 1: CAJAS */}
            {pestanaActiva === 'cajas' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Historial de Cajas ({cajas.length})
                  </h2>
                </div>

                {cajas.length === 0 ? (
                  <Card className="text-center py-12">
                    <p className="text-gray-500">No hay cajas en este período</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {cajas.map(caja => (
                      <Card
                        key={caja.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => seleccionarCaja(caja)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-lg">
                                {format(new Date(caja.fecha_apertura), "dd/MM/yyyy HH:mm", { locale: es })}
                              </h3>
                              <Badge variant={caja.estado === 'abierta' ? 'success' : 'default'}>
                                {caja.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Responsable: {caja.usuarios?.nombre || 'N/A'}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Monto Inicial</p>
                            <p className="text-xl font-bold text-gray-800">
                              ${parseFloat(caja.monto_inicial).toFixed(2)}
                            </p>
                            {caja.estado === 'cerrada' && (
                              <>
                                <p className="text-sm text-gray-600 mt-2">Diferencia</p>
                                <p className={`text-lg font-bold ${
                                  caja.diferencia === 0 ? 'text-success' :
                                  caja.diferencia > 0 ? 'text-success' : 'text-danger'
                                }`}>
                                  {caja.diferencia > 0 ? '+' : ''}${parseFloat(caja.diferencia).toFixed(2)}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 2: VENTAS */}
            {pestanaActiva === 'ventas' && (
              <div className="space-y-4">
                {/* Filtros adicionales */}
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Historial de Ventas ({ventas.length})
                  </h2>
                  <select
                    value={filtroMetodoPago || ''}
                    onChange={e => {
                      setFiltroMetodoPago(e.target.value || null)
                      setTimeout(() => cargarVentas(userData.negocio_id), 100)
                    }}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary outline-none"
                  >
                    <option value="">Todos los métodos</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="fiado">Fiado</option>
                  </select>
                </div>

                {/* Totales del período */}
                {totales && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card padding="p-4" className="border-l-4 border-primary">
                      <p className="text-sm text-gray-600">Total Ventas</p>
                      <p className="text-2xl font-bold">${totales.total.toFixed(2)}</p>
                    </Card>
                    <Card padding="p-4" className="border-l-4 border-green-500">
                      <p className="text-sm text-gray-600">Efectivo</p>
                      <p className="text-2xl font-bold">${totales.efectivo.toFixed(2)}</p>
                    </Card>
                    <Card padding="p-4" className="border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600">Tarjeta</p>
                      <p className="text-2xl font-bold">${totales.tarjeta.toFixed(2)}</p>
                    </Card>
                    <Card padding="p-4" className="border-l-4 border-orange-500">
                      <p className="text-sm text-gray-600">Fiado</p>
                      <p className="text-2xl font-bold">${totales.fiado.toFixed(2)}</p>
                    </Card>
                  </div>
                )}

                {/* Lista de ventas */}
                {ventas.length === 0 ? (
                  <Card className="text-center py-12">
                    <p className="text-gray-500">No hay ventas en este período</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {ventas.map(venta => (
                      <Card key={venta.id} padding="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {format(new Date(venta.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                            </p>
                            <p className="text-sm text-gray-600">
                              Vendedor: {venta.usuarios?.nombre || 'N/A'}
                            </p>
                            {venta.cliente_nombre && (
                              <p className="text-sm text-gray-600">
                                Cliente: {venta.cliente_nombre}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary">
                              ${parseFloat(venta.total).toFixed(2)}
                            </p>
                            <Badge variant={
                              venta.metodo_pago === 'efectivo' ? 'success' :
                              venta.metodo_pago === 'tarjeta' ? 'default' : 'warning'
                            }>
                              {venta.metodo_pago}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 3: ANÁLISIS */}
            {pestanaActiva === 'analisis' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Análisis del Período
                </h2>

                {/* Totales */}
                {totales && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card padding="p-6" className="border-l-4 border-primary">
                      <p className="text-sm text-gray-600 mb-1">Total Vendido</p>
                      <p className="text-3xl font-bold">${totales.total.toFixed(2)}</p>
                      <p className="text-sm text-gray-600 mt-2">{totales.cantidad} ventas</p>
                    </Card>
                    <Card padding="p-6" className="border-l-4 border-green-500">
                      <p className="text-sm text-gray-600 mb-1">Promedio por Venta</p>
                      <p className="text-3xl font-bold">
                        ${totales.cantidad > 0 ? (totales.total / totales.cantidad).toFixed(2) : '0.00'}
                      </p>
                    </Card>
                    <Card padding="p-6" className="border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600 mb-1">Productos Vendidos</p>
                      <p className="text-3xl font-bold">
                        {productosMasVendidos.reduce((sum, p) => sum + p.cantidad, 0)}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">unidades</p>
                    </Card>
                  </div>
                )}

                {/* Gráfico de ventas por día */}
                {ventasPorDia.length > 0 && (
                  <Card>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Ventas por Día
                    </h3>
                    <LineChart width={900} height={300} data={ventasPorDia}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="fecha" 
                        tickFormatter={(fecha) => format(new Date(fecha), 'dd/MM', { locale: es })}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`$${value.toFixed(2)}`, 'Total']}
                        labelFormatter={(fecha) => format(new Date(fecha), 'dd/MM/yyyy', { locale: es })}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#572364" 
                        strokeWidth={3}
                        name="Ventas"
                      />
                    </LineChart>
                  </Card>
                )}

                {/* Top productos */}
                {productosMasVendidos.length > 0 && (
                  <Card>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Top 10 Productos Más Vendidos
                    </h3>
                    <BarChart width={900} height={400} data={productosMasVendidos}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#572364" name="Unidades vendidas" />
                    </BarChart>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {/* Modal detalle de caja */}
        <Modal
          isOpen={!!cajaSeleccionada}
          onClose={cerrarDetalleCaja}
          title="Detalle de Caja"
          maxWidth="max-w-3xl"
        >
          {cajaSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha Apertura</p>
                  <p className="font-semibold">
                    {format(new Date(cajaSeleccionada.fecha_apertura), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
                {cajaSeleccionada.fecha_cierre && (
                  <div>
                    <p className="text-sm text-gray-600">Fecha Cierre</p>
                    <p className="font-semibold">
                      {format(new Date(cajaSeleccionada.fecha_cierre), "dd/MM/yyyy HH:mm", { locale: es })}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Monto Inicial</p>
                  <p className="text-xl font-bold">${parseFloat(cajaSeleccionada.monto_inicial).toFixed(2)}</p>
                </div>
                {cajaSeleccionada.monto_esperado && (
                  <div>
                    <p className="text-sm text-gray-600">Monto Esperado</p>
                    <p className="text-xl font-bold">${parseFloat(cajaSeleccionada.monto_esperado).toFixed(2)}</p>
                  </div>
                )}
                {cajaSeleccionada.monto_real && (
                  <div>
                    <p className="text-sm text-gray-600">Monto Real</p>
                    <p className="text-xl font-bold">${parseFloat(cajaSeleccionada.monto_real).toFixed(2)}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-lg mb-3">
                  Movimientos ({movimientosCajaSeleccionada.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {movimientosCajaSeleccionada.map(mov => (
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
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  )
}