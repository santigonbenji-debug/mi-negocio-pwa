import React from 'react'
import { useLicencia } from '../../hooks/useLicencia'
import { Badge } from './Badge'

export const BadgeLicencia = () => {
  const { activa, diasRestantes, expirado, cargando } = useLicencia()
  
  if (cargando) return null
  
  // No mostrar si tiene más de 7 días
  if (diasRestantes > 7) return null
  
  // Determinar variante
  const variant = expirado ? 'danger' : 
                  diasRestantes <= 1 ? 'danger' :
                  diasRestantes <= 3 ? 'warning' : 'info'
  
  const texto = expirado ? 'Licencia expirada' :
                diasRestantes === 1 ? '¡Último día!' :
                `${diasRestantes} días restantes`
  
  return (
    <Badge variant={variant} className="animate-pulse">
      {texto}
    </Badge>
  )
}