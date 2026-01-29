import React from 'react'
import { Modal } from './Modal'

export const SectionGuide = ({ isOpen, onClose, title, steps }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`💡 Guía: ${title}`}>
            <div className="space-y-6">
                {steps.map((step, index) => (
                    <div key={index} className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                            {index + 1}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1">{step.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    </div>
                ))}
                <div className="mt-8 pt-6 border-t dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-500 italic text-center">
                        Esta guía te ayuda a entender cómo sacar el máximo provecho a esta sección.
                    </p>
                </div>
            </div>
        </Modal>
    )
}
