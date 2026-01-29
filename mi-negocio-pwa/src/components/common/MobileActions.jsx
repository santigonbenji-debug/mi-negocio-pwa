import React from 'react'

export const MobileActions = ({ actions }) => {
    if (!actions || actions.length === 0) return null

    return (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-2 pointer-events-none">
            {actions.map((action, index) => (
                <button
                    key={index}
                    onClick={action.onClick}
                    className={`
                        pointer-events-auto
                        flex items-center gap-2 px-4 py-3 rounded-full font-bold shadow-2xl transition-all active:scale-95
                        animate-in slide-in-from-bottom-5 fade-in duration-300
                        ${action.variant === 'danger'
                            ? 'bg-red-500 text-white shadow-red-500/30'
                            : action.variant === 'success'
                                ? 'bg-green-500 text-white shadow-green-500/30'
                                : action.variant === 'secondary'
                                    ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700'
                                    : 'bg-primary text-white shadow-primary/30'
                        }
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <span className="text-lg">{action.icon}</span>
                    <span className="uppercase text-[10px] tracking-wider font-black">{action.label}</span>
                </button>
            ))}
        </div>
    )
}
