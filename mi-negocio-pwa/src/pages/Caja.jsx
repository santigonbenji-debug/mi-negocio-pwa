// ============================================
// ¿QUÉ HACE ESTO?
// Página completa de gestión de caja
//
// FUNCIONALIDADES:
// - Ver si hay caja abierta
// - Abrir caja con monto inicial
// - Registrar ingresos y gastos
// - Ver movimientos del día
// - Cerrar caja con conteo
// - Ver historial de cajas anteriores
// ============================================

import React, { useState, useEffect } from 'react'
import { useCajaStore } from '../store/cajaStore'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Input } from '../components/common/Input'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Layout } from '../components/layout/Layout'

export const Caja = () => {
  const { user, userData } = useAuthStore()
  const {
    cajaActual,
    movimientos,
    historial,
    cargando,
    verificarCajaAbierta,
    abrirCaja,
    registrarMovimiento,
    cerrarCaja,
    cargarHistorial
  } = useCajaStore()

  // Modales
  const [modalAbrir, setModalAbrir] = useState(false)
  const [modalMovimiento, setModalMovimiento] = useState(false)
  const [modalCerrar, setModalCerrar] = useState(false)
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  // Form Abrir Caja
  const [montoInicial, setMontoInicial] = useState('')

  // Form Movimiento
  const [tipoMovimiento, setTipoMovimiento] = useState('ingreso')
  const [montoMovimiento, setMontoMovimiento] = useState('')
  const [conceptoMovimiento, setConceptoMovimiento] = useState('')

  // Form Cerrar Caja
  const [montoReal, setMontoReal] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Cargar caja al montar
  useEffect(() => {
    if (userData?.negocio_id) {
      verificarCajaAbierta(userData.negocio_id)
      cargarHistorial(userData.negocio_id)
    }
  }, [userData])

  // Abrir caja
  const handleAbrirCaja = async (e) => {
    e.preventDefault()
    try {
      await abrirCaja(userData.negocio_id, user.id, parseFloat(montoInicial))
      toast.success('✅ Caja abierta')
      setModalAbrir(false)
      setMontoInicial('')
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Registrar movimiento
  const handleRegistrarMovimiento = async (e) => {
    e.preventDefault()
    try {
      await registrarMovimiento(
        tipoMovimiento,
        parseFloat(montoMovimiento),
        conceptoMovimiento
      )
      toast.success('✅ Movimiento registrado')
      setModalMovimiento(false)
      setMontoMovimiento('')
      setConceptoMovimiento('')
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Cerrar caja
  const handleCerrarCaja = async (e) => {
    e.preventDefault()
    try {
      const cajaFinal = await cerrarCaja(parseFloat(montoReal), observaciones)
      
      const diferencia = cajaFinal.diferencia
      if (diferencia === 0) {
        toast.success('✅ Caja cerrada - Cuadra perfecto')
      } else if (diferencia > 0) {
        toast.success(`✅ Caja cerrada - Sobran $${diferencia.toFixed(2)}`)
      } else {
        toast.error(`⚠️ Caja cerrada - Faltan $${Math.abs(diferencia).toFixed(2)}`)
      }
      
      setModalCerrar(false)
      setMontoReal('')
      setObservaciones('')
      cargarHistorial(userData.negocio_id)
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Calcular totales
  const totales = {
    ingresos: movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + parseFloat(m.monto), 0),
    egresos: movimientos
      .filter(m => m.tipo === 'egreso' || m.tipo === 'gasto')
      .reduce((sum, m) => sum + parseFloat(m.monto), 0)
  }

  return (
  <Layout>
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {cargando ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Cargando...</p>
          </div>
        ) : !cajaActual ? (
          /* Sin caja abierta */
          <div className="max-w-2xl mx-auto">
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                No hay caja abierta
              </h2>
              <p className="text-gray-600 mb-6">
                Abre la caja para comenzar a registrar movimientos
              </p>
              <Button onClick={() => setModalAbrir(true)}>
                Abrir Caja
              </Button>
            </Card>

            {/* Historial */}
            {historial.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    Historial de Cajas
                  </h3>
                </div>
                <div className="space-y-3">
                  {historial.slice(0, 5).map(caja => (
                    <Card key={caja.id} padding="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {format(new Date(caja.fecha_apertura), "dd/MM/yyyy HH:mm", { locale: es })}
                          </p>
                          <p className="text-sm text-gray-600">
                            Usuario: {caja.usuarios?.nombre || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            ${caja.monto_real?.toFixed(2) || '0.00'}
                          </p>
                          {caja.diferencia !== null && caja.diferencia !== 0 && (
                            <Badge variant={caja.diferencia > 0 ? 'success' : 'danger'}>
                              {caja.diferencia > 0 ? '+' : ''}{caja.diferencia.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Caja abierta */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Info y acciones */}
            <div className="lg:col-span-1 space-y-6">
              {/* Estado de caja */}
              <Card>
                <div className="text-center mb-4">
                  <Badge variant="success">✓ Caja Abierta</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Monto inicial:</span>
                    <span className="font-bold">${cajaActual.monto_inicial.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Ingresos:</span>
                    <span className="font-bold text-green-600">+${totales.ingresos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Egresos:</span>
                    <span className="font-bold text-red-600">-${totales.egresos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-lg font-semibold">Total esperado:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${(cajaActual.monto_esperado || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Botones de acción */}
              <div className="space-y-3">
                <Button
                  className="w-full"
                  variant="success"
                  onClick={() => setModalMovimiento(true)}
                >
                  + Registrar Movimiento
                </Button>
                <Button
                  className="w-full"
                  variant="danger"
                  onClick={() => setModalCerrar(true)}
                >
                  Cerrar Caja
                </Button>
              </div>
            </div>

            {/* Columna derecha: Movimientos */}
            <div className="lg:col-span-2">
              <Card>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Movimientos del día ({movimientos.length})
                </h3>
                {movimientos.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay movimientos registrados
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {movimientos.map(mov => (
                      <div
                        key={mov.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {mov.concepto}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(mov.fecha), "HH:mm", { locale: es })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            mov.tipo === 'ingreso' ? 'success' :
                            mov.tipo === 'egreso' ? 'warning' : 'danger'
                          }>
                            {mov.tipo === 'ingreso' ? '+' : '-'}${parseFloat(mov.monto).toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Modal Abrir Caja */}
      <Modal
        isOpen={modalAbrir}
        onClose={() => setModalAbrir(false)}
        title="Abrir Caja"
      >
        <form onSubmit={handleAbrirCaja} className="space-y-4">
          <Input
            label="Monto inicial en caja *"
            type="number"
            step="0.01"
            value={montoInicial}
            onChange={e => setMontoInicial(e.target.value)}
            placeholder="0.00"
            required
          />
          <p className="text-sm text-gray-600">
            Ingresa el dinero con el que comienzas el día
          </p>
          <Button type="submit" className="w-full">
            Abrir Caja
          </Button>
        </form>
      </Modal>

      {/* Modal Registrar Movimiento */}
      <Modal
        isOpen={modalMovimiento}
        onClose={() => setModalMovimiento(false)}
        title="Registrar Movimiento"
      >
        <form onSubmit={handleRegistrarMovimiento} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de movimiento *
            </label>
            <div className="flex gap-3">
              <label className="flex-1">
                <input
                  type="radio"
                  name="tipo"
                  value="ingreso"
                  checked={tipoMovimiento === 'ingreso'}
                  onChange={e => setTipoMovimiento(e.target.value)}
                  className="mr-2"
                />
                Ingreso
              </label>
              <label className="flex-1">
                <input
                  type="radio"
                  name="tipo"
                  value="gasto"
                  checked={tipoMovimiento === 'gasto'}
                  onChange={e => setTipoMovimiento(e.target.value)}
                  className="mr-2"
                />
                Gasto
              </label>
            </div>
          </div>
          <Input
            label="Monto *"
            type="number"
            step="0.01"
            value={montoMovimiento}
            onChange={e => setMontoMovimiento(e.target.value)}
            placeholder="0.00"
            required
          />
          <Input
            label="Concepto *"
            value={conceptoMovimiento}
            onChange={e => setConceptoMovimiento(e.target.value)}
            placeholder="Ej: Pago a proveedor, Compra de cambio, etc."
            required
          />
          <Button type="submit" className="w-full">
            Registrar
          </Button>
        </form>
      </Modal>

      {/* Modal Cerrar Caja */}
      <Modal
        isOpen={modalCerrar}
        onClose={() => setModalCerrar(false)}
        title="Cerrar Caja"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCerrarCaja} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-1">Monto esperado:</p>
            <p className="text-3xl font-bold text-primary">
              ${(cajaActual?.monto_esperado || 0).toFixed(2)}
            </p>
          </div>
          <Input
            label="Monto real en caja *"
            type="number"
            step="0.01"
            value={montoReal}
            onChange={e => setMontoReal(e.target.value)}
            placeholder="0.00"
            required
          />
          <Input
            label="Observaciones (opcional)"
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            placeholder="Ej: Faltó cambio, sobró dinero..."
          />
          <p className="text-sm text-gray-600">
            Cuenta el dinero físico en la caja y compáralo con el monto esperado
          </p>
          <Button type="submit" variant="danger" className="w-full">
            Cerrar Caja
          </Button>
        </form>
      </Modal>
    </div>
    </Layout>
  )
}