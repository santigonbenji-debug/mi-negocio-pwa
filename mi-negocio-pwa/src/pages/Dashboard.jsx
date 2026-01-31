// ============================================
// ¿QUÉ HACE ESTO?
// Dashboard principal con métricas y gráficos
//
// FUNCIONALIDADES:
// - Cards de acceso rápido a cada sección
// - Métricas en tiempo real
// - Gráfico de ventas por día
// - Productos más vendidos
// - Desglose por método de pago
// ============================================

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '../store/dashboardStore'
import { useAuthStore } from '../store/authStore'
import { usePermisos } from '../hooks/usePermisos'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { DashboardFilters } from '../components/dashboard/DashboardFilters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DetalleGananciaModal } from '../components/dashboard/DetalleGananciaModal'
import { DetalleCategoriasModal } from '../components/dashboard/DetalleCategoriasModal'
import { HelpButton } from '../components/common/HelpButton'
import { SectionGuide } from '../components/common/SectionGuide'
import { MobileActions } from '../components/common/MobileActions'

export const Dashboard = () => {
  
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { esAdmin } = usePermisos()
  const {
    resumen,
    ventasPorDia,
    productosMasVendidos,
    ventasPorMetodoPago,
    ventasKgHoy,
    cargando,
    mesFiltro,
    anioFiltro,
    periodosDisponibles,
    desgloseGanancia,
    gananciaCategorias,
    cargarPeriodos,
    cargarDatos
  } = useDashboardStore()

  // Estados modales
  const [modalGanancia, setModalGanancia] = useState(false)
  const [modalCategorias, setModalCategorias] = useState(false)
  const [modalAyuda, setModalAyuda] = useState(false)

  const pasosAyuda = [
    { title: '💰 Resumen de Ganancias', description: 'Aquí ves cuánto dinero entró por ventas y cuánto es tu ganancia real (lo que te queda limpio después de pagar el costo de los productos).' },
    { title: '🏦 Dinero en Caja', description: 'Es el efectivo que deberías tener físicamente en tu local ahora mismo.' },
    { title: '🏅 Lo más Rentable', description: 'Te muestra qué categorías y productos te están dando más beneficios para que sepas qué promocionar más.' },
    { title: '🗓️ Filtros de Período', description: 'Usa el selector arriba a la derecha para ver los números de meses pasados.' }
  ]

  // Cargar periodos y datos al montar
  useEffect(() => {
    const inicializarDashboard = async () => {
      if (user?.negocio_id) {
        const periodoActual = await cargarPeriodos(user.negocio_id)
        if (periodoActual) {
          cargarDatos(user.negocio_id, periodoActual.mes, periodoActual.anio)
        } else {
          cargarDatos(user.negocio_id)
        }
      }
    }

    inicializarDashboard()
  }, [user])

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const handleCambioFiltros = (valorSurtido) => {
    const [mes, anio] = valorSurtido.split('-').map(Number)
    cargarDatos(user.negocio_id, mes, anio)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-primary dark:text-primary-light mb-2">
              {esAdmin ? '📈 Dashboard' : '👋 ¡Bienvenid@!'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              {esAdmin ? 'Resumen general de tu negocio' : 'Punto de Venta - El Amigo'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <HelpButton onClick={() => setModalAyuda(true)} />
            {esAdmin && (
              <div id="dashboard-filters" className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border dark:border-gray-700">
                <DashboardFilters
                  mes={mesFiltro}
                  anio={anioFiltro}
                  periodos={periodosDisponibles}
                  onChange={handleCambioFiltros}
                />
              </div>
            )}
          </div>
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xl text-gray-600 dark:text-gray-400 font-medium anim-pulse">Cargando datos...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Grid Principal: Métricas */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 ${esAdmin ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-2'}`}>

              {esAdmin && (
                <>
                  {/* Card Ganancias Fusionada */}
                  <Card
                    padding="p-0 overflow-hidden"
                    className="relative group border-l-4 border-green-500 cursor-pointer hover:shadow-lg transition-all active:scale-95 sm:col-span-2 lg:col-span-2 xl:col-span-2"
                    onClick={() => setModalGanancia(true)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tu Negocio este Mes</p>
                          <h2 className="text-4xl font-black text-green-600 dark:text-green-400">
                            ${resumen?.gananciaMes?.toFixed(2) || '0.00'}
                          </h2>
                          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-tight">Ganancia Real (Limpia)</p>
                        </div>
                        <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">💰</span>
                      </div>
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t dark:border-gray-700">
                        <div>
                          <p className="text-lg font-bold dark:text-gray-100">{resumen?.ventasDelMes || 0}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black">Ventas Realizadas</p>
                        </div>
                        <div className="border-l dark:border-gray-700 pl-4">
                          <p className="text-lg font-bold text-primary">${resumen?.ingresosDelMes?.toFixed(2) || '0.00'}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black">Dinero que entró</p>
                        </div>
                      </div>
                      <p className="mt-3 text-[10px] text-primary font-bold animate-pulse">CLIC PARA VER DESGLOSE →</p>
                    </div>
                  </Card>

                  {/* Card Dinero en Caja */}
                  <Card padding="p-0 overflow-hidden" className="relative group border-l-4 border-blue-500 xl:col-span-1">
                    <div className="p-6">
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Dinero en Caja</p>
                      <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                        ${resumen?.enCaja?.toFixed(2) || '0.00'}
                      </p>
                      <p className="mt-2 text-[10px] font-bold text-gray-400 leading-tight">
                        Efectivo que deberías tener disponible.
                      </p>
                    </div>
                  </Card>

                  <Card
                    padding="p-0 overflow-hidden"
                    className="relative group border-l-4 border-pink-500 cursor-pointer hover:shadow-lg transition-all active:scale-95 xl:col-span-1"
                    onClick={() => setModalCategorias(true)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lo mejor</p>
                        <span className="text-xl group-hover:translate-y-[-2px] transition-transform">🏆</span>
                      </div>
                      <p className="text-2xl font-black text-pink-600 dark:text-pink-400 truncate">
                        {gananciaCategorias?.[0]?.nombre || 'Sin datos'}
                      </p>
                      <p className="mt-2 text-[10px] font-bold text-gray-400">
                        Categoría más rentable
                      </p>
                    </div>
                  </Card>

                  {/* Card Por Cobrar (Fiados) */}
                  <Card
                    padding="p-0 overflow-hidden"
                    className="relative group border-l-4 border-orange-500 cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => navigate('/fiados')}
                  >
                    <div className="p-6">
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Por Cobrar</p>
                      <p className="text-3xl font-bold dark:text-white">
                        ${resumen?.deudaTotal?.toFixed(2) || '0.00'}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
                        {resumen?.clientesConDeuda || 0} clientes
                      </p>
                    </div>
                  </Card>

                  {/* Card Stock Crítico */}
                  <Card
                    padding="p-0 overflow-hidden"
                    className="relative group border-l-4 border-red-500 cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => navigate('/inventario')}
                  >
                    <div className="p-6">
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Stock Crítico</p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {resumen?.productosStockBajo || 0}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                        Reponer urgente
                      </p>
                    </div>
                  </Card>
                </>
              )}

              {/* Botones Gigantes para Empleado */}
              {!esAdmin && (
                <>
                  <button
                    onClick={() => navigate('/ventas')}
                    className="p-10 bg-primary text-white rounded-[32px] shadow-xl hover:bg-primary-dark transition-all transform hover:scale-[1.03] active:scale-[0.97] flex flex-col items-center gap-4 group col-span-1"
                  >
                    <span className="text-6xl group-hover:scale-110 transition-transform">🛒</span>
                    <div className="text-center">
                      <p className="text-2xl font-black">NUEVA VENTA</p>
                      <p className="text-primary-light/80 font-medium">F1 o clic aquí</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/fiados')}
                    className="p-10 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-[32px] shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-primary transform hover:scale-[1.03] active:scale-[0.97] flex flex-col items-center gap-4 group col-span-1"
                  >
                    <span className="text-6xl group-hover:rotate-12 transition-transform">📒</span>
                    <div className="text-center">
                      <p className="text-2xl font-black">COBRAR FIADO</p>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Cuentas de clientes</p>
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* Segunda parte - Gráficos y Tablas (Solo Admin) */}
            {esAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico de Tendencia */}
                <Card className="flex flex-col">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                    📈 Tendencia de Ventas (Período)
                  </h3>
                  <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ventasPorDia}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                          dataKey="fecha"
                          tickFormatter={(f) => format(new Date(f), 'dd', { locale: es })}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Bar
                          dataKey="total"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Productos Más Vendidos */}
                <Card>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                    🏅 Productos que más dinero generaron
                  </h3>
                  <div className="space-y-4">
                    {productosMasVendidos.slice(0, 6).map((prod, i) => (
                      <div key={prod.nombre} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 dark:text-white">{prod.nombre}</p>
                          <p className="text-xs text-gray-500 font-medium">{prod.cantidad} {prod.cantidad === 1 ? 'unidad vendida' : 'unidades vendidas'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 dark:text-green-400 leading-none">${(prod.monto || 0).toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Total Generado</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Métodos de Pago */}
                <Card>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                    💳 Ventas por metodo de pago 
                  </h3>
                  <div className="space-y-5">
                    {ventasPorMetodoPago.map((item, index) => {
                      const total = ventasPorMetodoPago.reduce((sum, i) => sum + i.total, 0)
                      const porcentaje = total > 0 ? (item.total / total * 100).toFixed(0) : 0
                      const colors = {
                        'Efectivo': 'bg-green-500',
                        'Transferencia': 'bg-blue-500',
                        'Fiado': 'bg-orange-500'
                      }
                      return (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-2 font-bold dark:text-gray-300">
                            <span>{item.metodo}</span>
                            <span>${item.total.toLocaleString()} ({porcentaje}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                            <div className={`h-full ${colors[item.metodo] || 'bg-gray-400'} transition-all duration-500`} style={{ width: `${porcentaje}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
                {/* Ventas por KG */}
                <Card>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                    ⚖️ Ventas por Peso (KG)
                  </h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {ventasKgHoy.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">No hay ventas por KG en este período</p>
                    ) : (
                      ventasKgHoy.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{item.nombre}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Total Vendido</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-primary">{item.kg} kg</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Alertas */}
                <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
                  <h3 className="text-xl font-bold text-red-800 dark:text-red-400 mb-6 flex items-center gap-2">
                    ⚠️ Alertas de Inventario
                  </h3>
                  <div className="space-y-4">
                    {resumen?.productosStockBajo > 0 ? (
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Productos por reponer:</span>
                        <Button variant="danger" className="py-2 px-5 text-sm font-bold" onClick={() => navigate('/inventario')}>
                          Ver {resumen.productosStockBajo}
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center gap-3">
                        <span className="text-2xl">✨</span>
                        <p className="text-green-700 dark:text-green-400 font-bold">¡Todo el stock está al día!</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales solo para Admin */}
      {esAdmin && (
        <>
          <DetalleGananciaModal
            isOpen={modalGanancia}
            onClose={() => setModalGanancia(false)}
            datos={desgloseGanancia}
            gastos={resumen?.gastosTotalesMes || 0}
            mesStr={meses[mesFiltro]}
          />

          <DetalleCategoriasModal
            isOpen={modalCategorias}
            onClose={() => setModalCategorias(false)}
            datos={gananciaCategorias}
            mesStr={meses[mesFiltro]}
          />

          <SectionGuide
            isOpen={modalAyuda}
            onClose={() => setModalAyuda(false)}
            title="Dashboard"
            steps={pasosAyuda}
          />
        </>
      )}

      <SectionGuide
        isOpen={modalAyuda}
        onClose={() => setModalAyuda(false)}
        title="Dashboard"
        steps={pasosAyuda}
      />

      {esAdmin && (
        <MobileActions
          actions={[
            {
              label: 'Filtros',
              icon: '📅',
              onClick: () => document.getElementById('dashboard-filters')?.scrollIntoView({ behavior: 'smooth' }),
              variant: 'secondary'
            }
          ]}
        />
      )}
    </Layout>
  )
}
