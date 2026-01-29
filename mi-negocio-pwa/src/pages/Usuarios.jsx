import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { usePermisos } from '../hooks/usePermisos'
import { usuariosService } from '../services/usuarios'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { HelpButton } from '../components/common/HelpButton'
import { SectionGuide } from '../components/common/SectionGuide'

export const Usuarios = () => {
  const { user } = useAuthStore()
  const { esAdmin } = usePermisos()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [modalCrear, setModalCrear] = useState(false)
  const [modalWhatsApp, setModalWhatsApp] = useState(false)
  const [mensajeWhatsApp, setMensajeWhatsApp] = useState('')
  const [usuarioCreado, setUsuarioCreado] = useState(null)
  const [modalAyuda, setModalAyuda] = useState(false)

  const pasosAyudaUsuarios = [
    { title: '👑 Roles', description: 'Los Administradores ven todo. Los Empleados solo pueden vender y gestionar la caja.' },
    { title: '➕ Crear Usuario', description: 'Define nombre y email. El sistema te dará una contraseña temporal para que se la envíes.' },
    { title: '📱 WhatsApp', description: 'Al crear un usuario, puedes enviarle sus accesos directamente por WhatsApp con un solo clic.' },
    { title: '🚫 Desactivar', description: 'Si un empleado ya no trabaja contigo, puedes desactivar su cuenta sin borrar su historial.' }
  ]

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('empleado')

  useEffect(() => {
    cargarUsuarios()
  }, [user])

  const cargarUsuarios = async () => {
    if (!user?.negocio_id) return
    setCargando(true)
    try {
      const data = await usuariosService.obtenerTodos(user.negocio_id)
      setUsuarios(data)
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      toast.error('Error al cargar usuarios')
    } finally {
      setCargando(false)
    }
  }

  const generarPasswordAleatoria = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let pass = ''
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pass)
  }

  const handleCrearUsuario = async (e) => {
    e.preventDefault()

    if (!nombre || !email || !password) {
      toast.error('Completa todos los campos')
      return
    }

    setCargando(true)
    try {
      const nuevoUsuario = await usuariosService.crear(
        email,
        password,
        nombre,
        rol,
        user.negocio_id
      )

      const mensaje = usuariosService.generarMensajeWhatsApp(
        nombre,
        email,
        password
      )

      setUsuarioCreado(nuevoUsuario)
      setMensajeWhatsApp(mensaje)
      setModalCrear(false)
      setModalWhatsApp(true)

      await cargarUsuarios()

      setNombre('')
      setEmail('')
      setPassword('')
      setRol('empleado')

      toast.success('Usuario creado exitosamente')
    } catch (error) {
      console.error('Error al crear usuario:', error)
      if (error.message.includes('already registered')) {
        toast.error('Este email ya esta registrado')
      } else {
        toast.error('Error al crear usuario')
      }
    } finally {
      setCargando(false)
    }
  }

  const copiarMensaje = () => {
    navigator.clipboard.writeText(mensajeWhatsApp)
    toast.success('Mensaje copiado al portapapeles')
  }

  const abrirWhatsApp = () => {
    const mensajeCodificado = encodeURIComponent(mensajeWhatsApp)
    window.open(`https://wa.me/?text=${mensajeCodificado}`, '_blank')
  }

  const toggleActivo = async (usuario) => {
    try {
      await usuariosService.toggleActivo(usuario.id, !usuario.activo)
      toast.success(`Usuario ${usuario.activo ? 'desactivado' : 'activado'}`)
      await cargarUsuarios()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar usuario')
    }
  }

  const handleEliminar = async (usuario) => {
    if (!window.confirm(`¿Estas seguro de eliminar a ${usuario.nombre}? Esta accion no se puede deshacer.`)) {
      return
    }

    try {
      await usuariosService.eliminar(usuario.id)
      toast.success('Usuario eliminado correctamente')
      await cargarUsuarios()
    } catch (error) {
      console.error('Error al eliminar:', error)
      toast.error('Error al eliminar usuario')
    }
  }

  if (!esAdmin) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <p className="text-6xl mb-4">🔒</p>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Acceso Restringido
            </h2>
            <p className="text-gray-600">
              Solo los administradores pueden gestionar usuarios
            </p>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-primary italic">👥 Gestión de Usuarios</h1>
            <HelpButton onClick={() => setModalAyuda(true)} />
          </div>
          <Button onClick={() => setModalCrear(true)}>
            + Crear Usuario
          </Button>
        </div>

        {cargando ? (
          <Card className="text-center py-12">
            <p className="text-xl text-gray-600">Cargando usuarios...</p>
          </Card>
        ) : usuarios.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">No hay usuarios registrados</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {usuarios.map(usuario => (
              <Card key={usuario.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {usuario.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{usuario.nombre}</h3>
                      <p className="text-sm text-gray-600">{usuario.email}</p>
                    </div>
                  </div>
                  <Badge variant={usuario.activo ? 'success' : 'danger'}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={usuario.rol === 'admin' ? 'warning' : 'default'}>
                      {usuario.rol === 'admin' ? '👑 Admin' : '👤 Empleado'}
                    </Badge>
                    <p className="text-xs text-gray-500">
                      Creado: {format(new Date(usuario.creado_en), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>

                  {usuario.id !== user.id && (
                    <div className="flex gap-2">
                      <Button
                        variant={usuario.activo ? 'secondary' : 'success'}
                        onClick={() => toggleActivo(usuario)}
                        className="flex-1 text-sm"
                      >
                        {usuario.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleEliminar(usuario)}
                        className="flex-1 text-sm"
                      >
                        🗑️ Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={modalCrear}
          onClose={() => setModalCrear(false)}
          title="Crear Nuevo Usuario"
        >
          <form onSubmit={handleCrearUsuario} className="space-y-4">
            <Input
              label="Nombre completo"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Juan Perez"
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña temporal
              </label>
              <div className="flex gap-2">
                <Input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={generarPasswordAleatoria}
                >
                  🎲 Generar
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <select
                value={rol}
                onChange={e => setRol(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none"
              >
                <option value="empleado">👤 Empleado</option>
                <option value="admin">👑 Administrador</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {rol === 'admin'
                  ? 'Tendra acceso completo al sistema'
                  : 'Solo podra hacer ventas y gestionar caja'
                }
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </form>
        </Modal>

        <Modal
          isOpen={modalWhatsApp}
          onClose={() => setModalWhatsApp(false)}
          title="✅ Usuario Creado"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="font-semibold text-green-800 mb-1">
                ✅ Usuario creado exitosamente
              </p>
              <p className="text-sm text-green-700">
                {usuarioCreado?.nombre} puede iniciar sesion con las credenciales generadas
              </p>
            </div>

            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                📱 Mensaje para enviar por WhatsApp:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {mensajeWhatsApp}
                </pre>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={copiarMensaje}
                variant="success"
                className="flex-1"
              >
                📋 Copiar Mensaje
              </Button>
              <Button
                onClick={abrirWhatsApp}
                variant="primary"
                className="flex-1"
              >
                💬 Abrir WhatsApp
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Este mensaje contiene la contraseña temporal. Envialo de forma segura.
            </p>
          </div>
        </Modal>

        <SectionGuide
          isOpen={modalAyuda}
          onClose={() => setModalAyuda(false)}
          title="Gestión de Usuarios"
          steps={pasosAyudaUsuarios}
        />
      </div>
    </Layout>
  )
}