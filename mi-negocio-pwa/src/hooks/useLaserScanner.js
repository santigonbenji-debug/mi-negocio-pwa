import { useEffect, useRef } from 'react';

/**
 * Hook para capturar la entrada de una lectora de códigos de barras (HID).
 * Las lectoras HID emulan un teclado y envían caracteres rápidamente seguidos de un "Enter".
 * 
 * @param {Function} onScan - Callback al detectar un código completo.
 * @param {Object} options - Opciones de configuración.
 * @param {number} options.minChars - Mínimo de caracteres para considerar un código (default: 3).
 * @param {number} options.bufferTimeout - Tiempo máximo entre teclas en ms (default: 50).
 */
export const useLaserScanner = (onScan, { minChars = 3, bufferTimeout = 50 } = {}) => {
    const buffer = useRef('');
    const lastKeyTime = useRef(0);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignorar si el foco está en un input/textarea (opcional, pero las lectoras suelen "escribir" donde esté el foco)
            // Sin embargo, el usuario pidió que funcione globalmente en la sección de ventas.
            // Si el foco está en un input, prevenimos que se ensucie el input si es una ráfaga de escáner.

            const currentTime = Date.now();
            const isFast = currentTime - lastKeyTime.current < bufferTimeout;

            // Si recibimos Enter y el buffer tiene contenido, procesamos
            if (e.key === 'Enter') {
                if (buffer.current.length >= minChars) {
                    // Es un escaneo válido
                    onScan(buffer.current);
                    buffer.current = '';
                    e.preventDefault();
                    e.stopPropagation();
                } else {
                    // No es un escaneo (fue un Enter manual o el código es muy corto)
                    buffer.current = '';
                }
                return;
            }

            // Si es una tecla imprimible (un solo carácter)
            if (e.key.length === 1) {
                // Si el tiempo entre teclas es muy largo, reiniciamos el buffer (asumimos que es escritura manual)
                // Excepto si es el primer carácter.
                if (buffer.current.length > 0 && !isFast) {
                    buffer.current = '';
                }

                buffer.current += e.key;
                lastKeyTime.current = currentTime;
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [onScan, minChars, bufferTimeout]);

    return null;
};
