// ============================================
// ¿QUÉ HACE ESTO?
// Filtros de fecha reutilizables con botones rápidos
//
// ANALOGÍA:
// Como tener un calendario con atajos:
// "Ver lo de hoy", "Ver la semana", etc.
// ============================================

import React from 'react'
import { Button } from './Button'
import { Input } from './Input'

export const DateFilters = ({ 
  fechaInicio, 
  fechaFin, 
  rangoActivo,
  onRangoRapido,
  onFechasPersonalizadas,
  onAplicar
}) => {
  const [inicioLocal, setInicioLocal] = React.useState(
    fechaInicio.toISOString().split('T')[0]
  )
  const [finLocal, setFinLocal] = React.useState(
    fechaFin.toISOString().split('T')[0]
  )

  const handleAplicar = () => {
    const inicio = new Date(inicioLocal)
    inicio.setHours(0, 0, 0, 0)
    
    const fin = new Date(finLocal)
    fin.setHours(23, 59, 59, 999)
    
    onFechasPersonalizadas(inicio, fin)
    onAplicar()
  }

  const botones = [
    { label: 'Hoy', valor: 'hoy' },
    { label: 'Última Semana', valor: 'semana' },
    { label: 'Último Mes', valor: 'mes' }
  ]

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        📅 Filtrar por Fecha
      </h3>
      
      {/* Botones rápidos */}
      <div className="flex flex-wrap gap-2 mb-4">
        {botones.map(boton => (
          <button
            key={boton.valor}
            onClick={() => {
              onRangoRapido(boton.valor)
              onAplicar()
            }}
            className={`
              px-4 py-2 rounded-lg font-semibold transition-all
              ${rangoActivo === boton.valor
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            {boton.label}
          </button>
        ))}
      </div>

      {/* Selector personalizado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Inicio
          </label>
          <input
            type="date"
            value={inicioLocal}
            onChange={e => setInicioLocal(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Fin
          </label>
          <input
            type="date"
            value={finLocal}
            onChange={e => setFinLocal(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary outline-none"
          />
        </div>
        
        <div className="flex items-end">
          <Button 
            onClick={handleAplicar}
            className="w-full"
            variant="success"
          >
            Aplicar Fechas
          </Button>
        </div>
      </div>
    </div>
  )
}