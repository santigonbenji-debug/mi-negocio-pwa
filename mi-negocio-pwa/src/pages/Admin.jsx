import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { Input } from '../components/common/Input'
import { Modal } from '../components/common/Modal'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '../store/authStore'
export const Admin = () => {
  const { user } = useAuthStore()
  
  // PROTECCIÓN: Solo tu email puede acceder
  const EMAIL_ADMIN = 'santigonbenji@gmail.com' // ⚠️ REEMPLAZAR
  
  if (!user || user.email !== EMAIL_ADMIN) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">
            Esta página es solo para administradores del sistema.
          </p>
        </Card>
      </div>
    )
  }
  const [negocios, setNegocios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos') // todos, activos, proximos, expirados
  const [busqueda, setBusqueda] = useState('')
  
  // Modal extender licencia
  const [modalExtender, setModalExtender] = useState(false)
  const [negocioSeleccionado, setNegocioSeleccionado] = useState(null)
  const [diasExtender, setDiasExtender] = useState('30')
  const [notaAdmin, setNotaAdmin] = useState('')

  useEffect(() => {
    cargarNegocios()
  }, [])

  const cargarNegocios = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('negocios_licencias')
        .select('*')
        .order('dias_restantes', { ascending: true })
      
      if (error) throw error
      setNegocios(data || [])
    } catch (error) {
      console.error('Error cargando negocios:', error)
      toast.error('Error al cargar negocios')
    } finally {
      setCargando(false)
    }
  }

  const handleExtenderLicencia = async () => {
    if (!negocioSeleccionado || !diasExtender) {
      toast.error('Selecciona un negocio y cantidad de días')
      return
    }

    try {
      const { data, error } = await supabase.rpc('extender_licencia', {
        p_negocio_id: negocioSeleccionado.id,
        p_dias: parseInt(diasExtender),
        p_nota: notaAdmin || null
      })

      if (error) throw error

      toast.success(`Licencia extendida ${diasExtender} días`)
      setModalExtender(false)
      setNegocioSeleccionado(null)
      setDiasExtender('30')
      setNotaAdmin('')
      cargarNegocios()
    } catch (error) {
      console.error('Error extendiendo licencia:', error)
      toast.error('Error al extender licencia')
    }
  }

  const abrirModalExtender = (negocio) => {
    setNegocioSeleccionado(negocio)
    setNotaAdmin(negocio.notas_admin || '')
    setModalExtender(true)
  }

  // Filtrar negocios
  const negociosFiltrados = negocios
    .filter(n => {
      if (filtro === 'activos') return !n.expirado
      if (filtro === 'proximos') return n.dias_restantes <= 7 && !n.expirado
      if (filtro === 'expirados') return n.expirado
      return true
    })
    .filter(n => {
      if (!busqueda) return true
      return n.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
             n.email_owner?.toLowerCase().includes(busqueda.toLowerCase())
    })

  // Estadísticas
  const stats = {
    total: negocios.length,
    activos: negocios.filter(n => !n.expirado).length,
    proximos: negocios.filter(n => n.dias_restantes <= 7 && !n.expirado).length,
    expirados: negocios.filter(n => n.expirado).length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔐 Panel de Administración
          </h1>
          <p className="text-gray-600">
            Gestión de licencias de negocios registrados
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <p className="text-gray-600 text-sm">Total Negocios</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </Card>
          <Card className="text-center">
            <p className="text-gray-600 text-sm">Con Licencia Activa</p>
            <p className="text-3xl font-bold text-green-600">{stats.activos}</p>
          </Card>
          <Card className="text-center">
            <p className="text-gray-600 text-sm">Próximos a Expirar</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.proximos}</p>
          </Card>
          <Card className="text-center">
            <p className="text-gray-600 text-sm">Expirados</p>
            <p className="text-3xl font-bold text-red-600">{stats.expirados}</p>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Buscar por nombre o email..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button
                variant={filtro === 'todos' ? 'primary' : 'secondary'}
                onClick={() => setFiltro('todos')}
              >
                Todos ({stats.total})
              </Button>
              <Button
                variant={filtro === 'activos' ? 'primary' : 'secondary'}
                onClick={() => setFiltro('activos')}
              >
                Activos ({stats.activos})
              </Button>
              <Button
                variant={filtro === 'proximos' ? 'primary' : 'secondary'}
                onClick={() => setFiltro('proximos')}
              >
                Próximos ({stats.proximos})
              </Button>
              <Button
                variant={filtro === 'expirados' ? 'primary' : 'secondary'}
                onClick={() => setFiltro('expirados')}
              >
                Expirados ({stats.expirados})
              </Button>
            </div>
          </div>
        </Card>

        {/* Lista de negocios */}
        {cargando ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">Cargando negocios...</p>
          </Card>
        ) : negociosFiltrados.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">No se encontraron negocios</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {negociosFiltrados.map(negocio => (
              <Card key={negocio.id} className={`
                ${negocio.expirado ? 'border-l-4 border-red-500' : ''}
                ${negocio.dias_restantes <= 3 && !negocio.expirado ? 'border-l-4 border-yellow-500' : ''}
              `}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Info del negocio */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{negocio.nombre}</h3>
                      {negocio.expirado ? (
                        <Badge variant="danger">Expirado</Badge>
                      ) : negocio.dias_restantes <= 1 ? (
                        <Badge variant="danger">¡Último día!</Badge>
                      ) : negocio.dias_restantes <= 3 ? (
                        <Badge variant="warning">{negocio.dias_restantes} días</Badge>
                      ) : negocio.dias_restantes <= 7 ? (
                        <Badge variant="warning">{negocio.dias_restantes} días</Badge>
                      ) : (
                        <Badge variant="success">{negocio.dias_restantes} días</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📧 {negocio.email_owner || 'Sin email'}</p>
                      <p>👤 {negocio.nombre_owner || 'Sin propietario'}</p>
                      <p>
                        📅 Expira: {negocio.expirado ? (
                          <span className="text-red-600 font-semibold">
                            {formatDistanceToNow(new Date(negocio.fecha_expiracion), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        ) : (
                          <span className={negocio.dias_restantes <= 3 ? 'text-yellow-600 font-semibold' : ''}>
                            {formatDistanceToNow(new Date(negocio.fecha_expiracion), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        )}
                      </p>
                      {negocio.notas_admin && (
                        <p className="mt-2 p-2 bg-gray-100 rounded text-xs">
                          📝 {negocio.notas_admin}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setDiasExtender('15')
                        abrirModalExtender(negocio)
                      }}
                    >
                      +15 días
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setDiasExtender('30')
                        abrirModalExtender(negocio)
                      }}
                    >
                      +30 días
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setDiasExtender('90')
                        abrirModalExtender(negocio)
                      }}
                    >
                      +3 meses
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setDiasExtender('365')
                        abrirModalExtender(negocio)
                      }}
                    >
                      +1 año
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Extender Licencia */}
      <Modal
        isOpen={modalExtender}
        onClose={() => setModalExtender(false)}
        title="Extender Licencia"
      >
        {negocioSeleccionado && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-bold text-lg">{negocioSeleccionado.nombre}</p>
              <p className="text-sm text-gray-600">{negocioSeleccionado.email_owner}</p>
              <p className="text-sm mt-2">
                Estado actual: {negocioSeleccionado.expirado ? (
                  <span className="text-red-600 font-semibold">Expirado</span>
                ) : (
                  <span className="text-green-600 font-semibold">
                    {negocioSeleccionado.dias_restantes} días restantes
                  </span>
                )}
              </p>
            </div>

            <Input
              label="Días a agregar"
              type="number"
              value={diasExtender}
              onChange={e => setDiasExtender(e.target.value)}
              placeholder="30"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nota administrativa (opcional)
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                rows="3"
                value={notaAdmin}
                onChange={e => setNotaAdmin(e.target.value)}
                placeholder="Ej: Cliente Premium - Renovación anual"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="success"
                onClick={handleExtenderLicencia}
                className="flex-1"
              >
                Extender {diasExtender} días
              </Button>
              <Button
                variant="secondary"
                onClick={() => setModalExtender(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}