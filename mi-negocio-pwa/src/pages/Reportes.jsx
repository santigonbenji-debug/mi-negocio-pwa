// ============================================
// ¿QUÉ HACE ESTO?
// Página de reportes históricos con filtros por fecha
//
// PESTAÑAS:
// 1. Cajas - Historial completo de cajas
// 2. Ventas - Historial de ventas con filtros
// 3. Análisis - Gráficos y tendencias
// ============================================

import React, { useEffect, useState } from 'react'
import { useReportesStore } from '../store/reportesStore'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { Modal } from '../components/common/Modal'
import { DateFilters } from '../components/common/DateFilters'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { exportarVentas } from '../utils/exportVentas'
import { es } from 'date-fns/locale'
import { DetalleVentaModal } from '../components/ventas/DetalleVentaModal'
import { DetalleCajaModal } from '../components/caja/DetalleCajaModal'
import { HelpButton } from '../components/common/HelpButton'
import { SectionGuide } from '../components/common/SectionGuide'

export const Reportes = () => {
  const { user } = useAuthStore()
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
    ventasPorHora,
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

  //✅ AGREGAR ESTOS ESTADOS:
  const [modalDetalle, setModalDetalle] = useState(false)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [modalAyuda, setModalAyuda] = useState(false)

  const pasosAyudaReportes = [
    { title: '📦 Cajas', description: 'Revisa el historial de todos tus cierres de caja anteriores para ver si hubo faltantes.' },
    { title: '🛒 Ventas', description: 'Filtra tus ventas por fecha para saber exactamente qué se vendió y cómo se pagó.' },
    { title: '📊 Análisis', description: 'Mira gráficos de tendencia: cuáles son tus mejores horas y qué días vendes más.' },
    { title: '📥 Exportar', description: 'Descarga toda la información en Excel para llevar tu contabilidad fuera de la app.' }
  ]


  // Cargar datos al cambiar pestaña o fechas
  useEffect(() => {
    if (!user?.negocio_id) return

    if (pestanaActiva === 'cajas') {
      cargarCajas(user.negocio_id)
    } else if (pestanaActiva === 'ventas') {
      cargarVentas(user.negocio_id)
    } else if (pestanaActiva === 'analisis') {
      cargarAnalisis(user.negocio_id)
    }
  }, [user, pestanaActiva])

  const handleAplicarFiltros = () => {
    if (!user?.negocio_id) return

    if (pestanaActiva === 'cajas') {
      cargarCajas(user.negocio_id)
    } else if (pestanaActiva === 'ventas') {
      cargarVentas(user.negocio_id)
    } else if (pestanaActiva === 'analisis') {
      cargarAnalisis(user.negocio_id)
    }
  }
  const handleExportarVentas = () => {
    try {
      exportarVentas(ventas, fechaInicio, fechaFin)
      toast.success('✅ Ventas exportadas correctamente')
    } catch (error) {
      toast.error('Error al exportar ventas')
      console.error(error)
    }
  }
  //Ver detalle de venta
  const handleVerDetalle = (ventaId) => {
    setVentaSeleccionada(ventaId)
    setModalDetalle(true)
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
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-primary dark:text-primary-light italic">📈 Reportes Históricos</h1>
            <HelpButton onClick={() => setModalAyuda(true)} />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium italic">Consulta el historial completo de tu negocio</p>
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
        <Button
          variant="secondary"
          onClick={handleExportarVentas}
          disabled={ventas.length === 0}
        >
          📥 Exportar Excel
        </Button>
        {/* Pestañas */}
        <div className="flex space-x-2 mb-6 border-b-2 border-gray-200 dark:border-gray-700">
          {pestanas.map(pestana => (
            <button
              key={pestana.id}
              onClick={() => setPestana(pestana.id)}
              className={`
                px-6 py-3 font-semibold transition-all
                ${pestanaActiva === pestana.id
                  ? 'border-b-4 border-primary text-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
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
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Historial de Cajas ({cajas.length})
                  </h2>
                </div>

                {cajas.length === 0 ? (
                  <Card className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No hay cajas en este período</p>
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
                              <h3 className="font-bold text-lg dark:text-white">
                                {format(new Date(caja.fecha_apertura), "dd/MM/yyyy HH:mm", { locale: es })}
                              </h3>
                              <Badge variant={caja.estado === 'abierta' ? 'success' : 'default'}>
                                {caja.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Responsable: {caja.usuarios?.nombre || 'N/A'}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Monto Inicial</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">
                              ${parseFloat(caja.monto_inicial).toFixed(2)}
                            </p>
                            {caja.estado === 'cerrada' && (
                              <>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Diferencia</p>
                                <p className={`text-lg font-bold ${caja.diferencia === 0 ? 'text-success' :
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Historial de Ventas ({ventas.length})
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: null, label: 'Todos' },
                      { id: 'efectivo', label: '💵 Efectivo' },
                      { id: 'tarjeta', label: '💳 Transferencia' },
                      { id: 'fiado', label: '📝 Fiado' }
                    ].map(metodo => (
                      <button
                        key={metodo.id}
                        onClick={() => {
                          setFiltroMetodoPago(metodo.id)
                          setTimeout(() => cargarVentas(user?.negocio_id), 100)
                        }}
                        className={`
                          px-4 py-2 rounded-lg font-semibold transition-all text-sm
                          ${filtroMetodoPago === metodo.id
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }
                        `}
                      >
                        {metodo.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Totales del período */}
                {totales && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card padding="p-4" className="border-l-4 border-primary">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Ventas</p>
                      <p className="text-2xl font-bold dark:text-white">${(totales.total || 0).toFixed(2)}</p>
                    </Card>
                    <Card padding="p-4" className="border-l-4 border-green-500">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Efectivo</p>
                      <p className="text-2xl font-bold dark:text-white">${(totales.efectivo || 0).toFixed(2)}</p>
                    </Card>
                    <Card padding="p-4" className="border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Transferencia</p>
                      <p className="text-2xl font-bold dark:text-white">${(totales.tarjeta || 0).toFixed(2)}</p>
                    </Card>
                    <Card padding="p-4" className="border-l-4 border-orange-500">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Fiado</p>
                      <p className="text-2xl font-bold dark:text-white">${(totales.fiado || 0).toFixed(2)}</p>
                    </Card>
                  </div>
                )}

                {/* Lista de ventas */}
                {ventas.length === 0 ? (
                  <Card className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No hay ventas en este período</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {ventas.map(venta => (
                      <Card
                        key={venta.id}
                        padding="p-4"
                        className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01]"
                        onClick={() => handleVerDetalle(venta.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-gray-100">
                              {format(new Date(venta.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Vendedor: {venta.usuarios?.nombre || 'N/A'}
                            </p>
                            {venta.cliente_nombre && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Cliente: {venta.cliente_nombre}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary dark:text-primary-light">
                                ${parseFloat(venta.total || 0).toFixed(2)}
                              </p>
                              <Badge variant={
                                venta.metodo_pago === 'efectivo' ? 'success' :
                                  venta.metodo_pago === 'tarjeta' ? 'default' : 'warning'
                              }>
                                {venta.metodo_pago}
                              </Badge>
                            </div>
                            <div className="text-primary dark:text-primary-light font-semibold text-sm">
                              Ver →
                            </div>
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Análisis del Período
                </h2>

                {/* Totales */}
                {totales && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card padding="p-6" className="border-l-4 border-primary">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Vendido</p>
                      <p className="text-3xl font-bold dark:text-white">${totales.total.toFixed(2)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{totales.cantidad} ventas</p>
                    </Card>
                    <Card padding="p-6" className="border-l-4 border-green-500">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Promedio por Venta</p>
                      <p className="text-3xl font-bold dark:text-white">
                        ${totales.cantidad > 0 ? (totales.total / totales.cantidad).toFixed(2) : '0.00'}
                      </p>
                    </Card>
                    <Card padding="p-6" className="border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Productos Vendidos</p>
                      <p className="text-3xl font-bold dark:text-white">
                        {productosMasVendidos.reduce((sum, p) => sum + p.cantidad, 0)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">unidades</p>
                    </Card>
                  </div>
                )}

                {/* Gráfico de ventas por día */}
                {ventasPorDia.length > 0 && (
                  <Card>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                      📅 Ventas por Día
                    </h3>
                    <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={ventasPorDia}>
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
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}

                {/* Gráfico de flujo horario */}
                {ventasPorHora.length > 0 && (
                  <Card>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                      ⏰ Flujo de Ventas por Hora
                    </h3>
                    <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ventasPorHora}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hora" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`$${value.toFixed(2)}`, 'Total']}
                          />
                          <Legend />
                          <Bar dataKey="total" fill="#8884d8" name="Ingresos ($)" />
                          <Bar dataKey="cantidad" fill="#82ca9d" name="Cant. Ventas" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 italic">
                      Este gráfico te ayuda a identificar las "horas pico" y los momentos más tranquilos de tu negocio.
                    </p>
                  </Card>
                )}

                {/* Top productos */}
                {productosMasVendidos.length > 0 && (
                  <Card>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                      🏆 Top 10 Productos Más Vendidos
                    </h3>
                    <div className="h-[400px] w-full" style={{ minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productosMasVendidos}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="cantidad" fill="#572364" name="Unidades vendidas" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {/* Modal detalle de caja */}
        <DetalleCajaModal
          isOpen={!!cajaSeleccionada}
          onClose={cerrarDetalleCaja}
          caja={cajaSeleccionada}
          movimientos={movimientosCajaSeleccionada}
        />

        {/* Modal Detalle Venta */}
        <DetalleVentaModal
          isOpen={modalDetalle}
          onClose={() => {
            setModalDetalle(false)
            setVentaSeleccionada(null)
          }}
          ventaId={ventaSeleccionada}
        />
        <SectionGuide
          isOpen={modalAyuda}
          onClose={() => setModalAyuda(false)}
          title="Reportes Históricos"
          steps={pasosAyudaReportes}
        />
      </div>
    </Layout>
  )
}