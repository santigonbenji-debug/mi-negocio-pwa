import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { licenciasUtils } from '../../utils/licencias'

export const ModalLicenciaExpirada = ({ 
  isOpen, 
  diasRestantes, 
  onVerHistorial,
  onCerrar = null  // Si null, no se puede cerrar
}) => {
  const contacto = licenciasUtils.getContactoRenovacion()
  const mensaje = encodeURIComponent(contacto.mensaje)
  const whatsappUrl = `https://wa.me/${contacto.whatsapp}?text=${mensaje}`
  
  // Obtener mensaje según días
  const info = licenciasUtils.getMensajeAviso(diasRestantes)
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onCerrar || (() => {})} 
      title={info?.titulo || "😊 ¡Tu prueba ha finalizado!"}
      maxWidth="max-w-md"
    >
      <div className="text-center space-y-6 py-4">
        {/* Ícono grande */}
        <div className="text-6xl">
          {diasRestantes <= 0 ? '🔒' : 
           diasRestantes <= 1 ? '⚠️' : 
           diasRestantes <= 3 ? '⏰' : '🎉'}
        </div>
        
        {/* Mensaje principal */}
        <div className="space-y-2">
          <p className="text-lg text-gray-700">
            {info?.mensaje || '¿Te gustó Mi Negocio? Contactanos para continuar.'}
          </p>
          
          {diasRestantes > 0 && diasRestantes <= 3 && (
            <p className="text-sm text-gray-600">
              Expira el {licenciasUtils.formatearFechaExpiracion(
                new Date(Date.now() + diasRestantes * 24 * 60 * 60 * 1000)
              )}
            </p>
          )}
        </div>
        
        {/* Botones de acción */}
        <div className="space-y-3">
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="success" className="w-full text-lg py-4">
              📱 Contactar por WhatsApp
            </Button>
          </a>
          
          {diasRestantes <= 0 && onVerHistorial && (
            <Button 
              variant="secondary" 
              onClick={onVerHistorial}
              className="w-full"
            >
              📊 Ver mi historial (solo lectura)
            </Button>
          )}
          
          {diasRestantes > 0 && onCerrar && (
            <Button 
              variant="secondary" 
              onClick={onCerrar}
              className="w-full"
            >
              Continuar usando ({diasRestantes} {diasRestantes === 1 ? 'día' : 'días'} restantes)
            </Button>
          )}
        </div>
        
        {/* Información adicional */}
        {diasRestantes <= 0 && (
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-600 mb-2">
              <strong>En modo solo lectura podés:</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Ver tu inventario de productos</li>
              <li>Consultar historial de ventas</li>
              <li>Revisar reportes y estadísticas</li>
              <li>Ver movimientos de caja</li>
            </ul>
            <p className="text-sm text-gray-500 mt-3">
              No podrás realizar nuevas ventas ni modificar información hasta renovar.
            </p>
          </div>
        )}
        
        {/* Footer con email */}
        <div className="text-xs text-gray-500 pt-4 border-t">
          También podés escribirnos a: <strong>{contacto.email}</strong>
        </div>
      </div>
    </Modal>
  )
}