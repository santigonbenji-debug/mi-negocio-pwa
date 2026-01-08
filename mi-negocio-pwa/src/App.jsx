import { useState } from 'react'
import { Button } from './components/common/Button'
import { Card } from './components/common/Card'
import { Input } from './components/common/Input'
import { Modal } from './components/common/Modal'
import { Badge } from './components/common/Badge'

function App() {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-primary mb-2">
            🎨 Sistema de Diseño Morado
          </h1>
          <p className="text-gray-600">
            Todos los componentes funcionando correctamente
          </p>
        </div>
        
        {/* Botones */}
        <Card>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Botones</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Morado Principal</Button>
            <Button variant="success">Verde Éxito</Button>
            <Button variant="danger">Rojo Peligro</Button>
            <Button variant="secondary">Gris Secundario</Button>
            <Button variant="primary" disabled>Deshabilitado</Button>
          </div>
        </Card>
        
        {/* Campos de entrada */}
        <Card>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Campos de Entrada</h2>
          <div className="space-y-4">
            <Input 
              label="Nombre del producto" 
              placeholder="Ej: Coca-Cola 500ml"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <Input 
              label="Campo con error" 
              placeholder="Este campo tiene un error"
              error="Este campo es obligatorio"
            />
            <Input 
              label="Precio" 
              type="number"
              placeholder="0.00"
            />
          </div>
        </Card>
        
        {/* Estados con Badges */}
        <Card>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Estados (Badges)</h2>
          <div className="flex flex-wrap gap-3">
            <Badge variant="success">✓ Activo</Badge>
            <Badge variant="danger">⚠ Stock bajo</Badge>
            <Badge variant="warning">⏳ Pendiente</Badge>
            <Badge variant="primary">★ Destacado</Badge>
            <Badge variant="default">Info general</Badge>
          </div>
        </Card>
        
        {/* Modal */}
        <Card>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Ventana Modal</h2>
          <Button onClick={() => setModalAbierto(true)}>
            Abrir Modal
          </Button>
        </Card>
        
        {/* Tarjetas de ejemplo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center">
            <div className="text-4xl mb-2">📦</div>
            <h3 className="font-bold text-lg">Inventario</h3>
            <p className="text-gray-600 text-sm mt-2">
              Control de productos
            </p>
          </Card>
          <Card className="text-center">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="font-bold text-lg">Caja</h3>
            <p className="text-gray-600 text-sm mt-2">
              Gestión de ventas
            </p>
          </Card>
          <Card className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="font-bold text-lg">Reportes</h3>
            <p className="text-gray-600 text-sm mt-2">
              Análisis de datos
            </p>
          </Card>
        </div>
        
      </div>
      
      {/* Modal de ejemplo */}
      <Modal 
        isOpen={modalAbierto} 
        onClose={() => setModalAbierto(false)} 
        title="Ejemplo de Modal"
      >
        <p className="text-gray-600 mb-4">
          Este es un modal funcionando correctamente. 
          Puedes cerrar haciendo click en la X, el botón de abajo, 
          o haciendo click fuera de esta ventana.
        </p>
        <div className="space-y-3">
          <Input label="Campo dentro del modal" placeholder="Escribe algo..." />
          <Button 
            variant="success" 
            onClick={() => setModalAbierto(false)}
            className="w-full"
          >
            Cerrar Modal
          </Button>
        </div>
      </Modal>
      
    </div>
  )
}

export default App