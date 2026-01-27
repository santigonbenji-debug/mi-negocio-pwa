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

import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '../store/dashboardStore'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const Dashboard = () => {
  const navigate = useNavigate()
 const { user } = useAuthStore()
  const {
    resumen,
    ventasPorDia,
    productosMasVendidos,
    ventasPorMetodoPago,
    cargando,
    cargarDatos
  } = useDashboardStore()

  // Cargar datos al montar
  useEffect(() => {
    if (user?.negocio_id) {
  cargarDatos(user.negocio_id)
}
  }, [user])

  

  // Cards de acceso rápido
  const accesoRapido = [
    {
      titulo: 'Punto de Venta',
      icono: '🛒',
      descripcion: 'Realizar ventas',
      color: 'bg-green-500',
      ruta: '/ventas'
    },
    {
      titulo: 'Caja',
      icono: '💰',
      descripcion: 'Control de caja',
      color: 'bg-blue-500',
      ruta: '/caja'
    },
    {
      titulo: 'Inventario',
      icono: '📦',
      descripcion: 'Gestionar productos',
      color: 'bg-purple-500',
      ruta: '/inventario'
    },
    {
      titulo: 'Fiados',
      icono: '📝',
      descripcion: 'Clientes y deudas',
      color: 'bg-orange-500',
      ruta: '/fiados'
    }
  ]

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            📊 Dashboard
          </h1>
          <p className="text-gray-600">
            Resumen general de tu negocio
          </p>
        </div>

        {cargando ? (
          <Card className="text-center py-12">
            <p className="text-xl text-gray-600">Cargando datos...</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Accesos Rápidos */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Acceso Rápido
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {accesoRapido.map(item => (
                  <Card
                    key={item.ruta}
                    className="cursor-pointer hover:shadow-2xl transition-all transform hover:scale-105"
                    onClick={() => navigate(item.ruta)}
                  >
                    <div className="text-center">
                      <div className={`${item.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <span className="text-4xl">{item.icono}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {item.titulo}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.descripcion}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Métricas Principales */}
            {resumen && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Métricas de Hoy
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card padding="p-6" className="border-l-4 border-green-500">
                    <p className="text-sm text-gray-600 mb-1">Ventas del Día</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {resumen.ventasDelDia}
                    </p>
                    <p className="text-sm text-green-600 font-semibold mt-2">
                      ${resumen.ingresosDelDia.toFixed(2)} ingresados
                    </p>
                  </Card>

                  <Card padding="p-6" className="border-l-4 border-blue-500">
                    <p className="text-sm text-gray-600 mb-1">En Caja</p>
                    <p className="text-3xl font-bold text-gray-800">
                      ${resumen.enCaja.toFixed(2)}
                    </p>
                    <p className="text-sm text-blue-600 font-semibold mt-2">
                      Monto esperado
                    </p>
                  </Card>

                  <Card padding="p-6" className="border-l-4 border-orange-500">
                    <p className="text-sm text-gray-600 mb-1">Deudas Totales</p>
                    <p className="text-3xl font-bold text-gray-800">
                      ${resumen.deudaTotal.toFixed(2)}
                    </p>
                    <p className="text-sm text-orange-600 font-semibold mt-2">
                      {resumen.clientesConDeuda} clientes deben
                    </p>
                  </Card>

                  <Card padding="p-6" className="border-l-4 border-red-500">
                    <p className="text-sm text-gray-600 mb-1">Stock Bajo</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {resumen.productosStockBajo}
                    </p>
                    <p className="text-sm text-red-600 font-semibold mt-2">
                      de {resumen.totalProductos} productos
                    </p>
                  </Card>
                </div>
              </div>
            )}
{/* Gráfico de Ventas por Día */}
<Card>
  <h2 className="text-2xl font-bold text-gray-800 mb-6">
    Ventas - Últimos 7 Días
  </h2>

  {ventasPorDia.length > 0 && ventasPorDia.some(d => d.total > 0) ? (
    <LineChart width={800} height={300} data={ventasPorDia}>
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
  ) : (
    <div className="text-center py-12 text-gray-500">
      <p className="text-lg mb-2">📈</p>
      <p>No hay ventas en los últimos 7 días</p>
      <p className="text-sm">Los datos aparecerán cuando realices ventas</p>
    </div>
  )}
</Card>
    
  

            {/* Grid de 2 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             
           
             {/* Productos Más Vendidos */}
<Card>
  <h2 className="text-2xl font-bold text-gray-800 mb-6">
    Productos Más Vendidos
  </h2>
  {productosMasVendidos.length > 0 ? (
    <BarChart width={500} height={300} data={productosMasVendidos}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="nombre" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="cantidad" fill="#572364" name="Unidades vendidas" />
    </BarChart>
  ) : (
    <div className="text-center py-12 text-gray-500">
      <p className="text-lg mb-2">📦</p>
      <p>No hay productos vendidos aún</p>
      <p className="text-sm">Realiza ventas de productos del inventario</p>
    </div>
  )}
</Card>

             
              

              {/* Ventas por Método de Pago */}
              {ventasPorMetodoPago.length > 0 && (
                <Card>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Ventas por Método de Pago (Hoy)
                  </h2>
                  <div className="space-y-4">
                    {ventasPorMetodoPago.map((item, index) => {
                      const total = ventasPorMetodoPago.reduce((sum, i) => sum + i.total, 0)
                      const porcentaje = total > 0 ? (item.total / total * 100).toFixed(1) : 0
                      
                      const colores = {
                        'Efectivo': { bg: 'bg-green-500', text: 'text-green-600' },
                        'Transferencia': { bg: 'bg-blue-500', text: 'text-blue-600' },
                        'Fiado': { bg: 'bg-orange-500', text: 'text-orange-600' }
                      }
                      
                      const color = colores[item.metodo]
                      
                      return (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-700">
                              {item.metodo}
                            </span>
                            <span className={`font-bold ${color.text}`}>
                              ${item.total.toFixed(2)} ({porcentaje}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`${color.bg} h-3 rounded-full transition-all`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>

            {/* Alertas */}
            {resumen && (resumen.productosStockBajo > 0 || resumen.clientesConDeuda > 0) && (
              <Card className="bg-yellow-50 border-l-4 border-yellow-500">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  ⚠️ Alertas
                </h3>
                <div className="space-y-2">
                  {resumen.productosStockBajo > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-gray-700">
                        {resumen.productosStockBajo} productos con stock bajo
                      </p>
                      <button
                        onClick={() => navigate('/inventario')}
                        className="text-primary font-semibold hover:underline"
                      >
                        Ver →
                      </button>
                    </div>
                  )}
                  {resumen.clientesConDeuda > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-gray-700">
                        {resumen.clientesConDeuda} clientes con deuda (${resumen.deudaTotal.toFixed(2)} total)
                      </p>
                      <button
                        onClick={() => navigate('/fiados')}
                        className="text-primary font-semibold hover:underline"
                      >
                        Ver →
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}