import React from 'react'

export const DashboardFilters = ({ mes, anio, periodos, onChange }) => {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    return (
        <div className="flex items-center gap-2">
            <select
                value={`${mes}-${anio}`}
                onChange={(e) => onChange(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-200 outline-none focus:border-primary transition-all"
            >
                {periodos.map((p) => (
                    <option key={`${p.mes}-${p.anio}`} value={`${p.mes}-${p.anio}`}>
                        {meses[p.mes]} {p.anio}
                    </option>
                ))}
            </select>
        </div>
    )
}
