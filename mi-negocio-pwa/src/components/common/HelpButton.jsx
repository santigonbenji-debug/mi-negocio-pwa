import React from 'react'

export const HelpButton = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-200 dark:border-blue-800/50 text-xs font-bold shadow-sm"
            title="Cómo funciona esta sección"
        >
            <span className="text-sm">❓</span>
            <span>Cómo funciona</span>
        </button>
    )
}
