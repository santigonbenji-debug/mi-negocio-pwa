// ============================================
// ¿QUÉ HACE ESTO?
// Define reglas que los datos deben cumplir
//
// ANALOGÍA:
// Como las reglas de tu negocio:
// - Los precios no pueden ser negativos
// - El stock no puede ser negativo
// - El nombre del producto es obligatorio
//
// USO:
// const datosValidados = validar(schemas.producto, datosDelFormulario)
// Si algo está mal, lanza un error con mensaje claro
// ============================================

import { z } from 'zod'

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

export const schemas = {
  // Producto
  producto: z.object({
    nombre: z.string()
      .min(1, "El nombre es obligatorio")
      .max(100, "Nombre muy largo (máx 100 caracteres)"),
    precio: z.number()
      .positive("El precio debe ser mayor a 0"),
    precio_costo: z.number()
      .min(0, "El precio de costo no puede ser negativo")
      .default(0),
    stock_actual: z.number()
      .int("El stock debe ser un número entero")
      .min(0, "El stock no puede ser negativo"),
    stock_minimo: z.number()
      .int()
      .min(0, "El stock mínimo no puede ser negativo")
      .default(5),
    codigo_barras: z.string().nullable().optional(),
    es_por_kg: z.boolean().default(false),
    categoria_id: z.string().uuid().nullable().optional()
  }),

  // Item de venta (para carrito)
  ventaItem: z.object({
    producto_id: z.string().uuid().nullable(),
    cantidad: z.number()
      .positive("La cantidad debe ser mayor a 0")
      .refine(val => {
        // Si es entero, debe ser al menos 1
        // Si es decimal, debe tener máximo 2 decimales
        const decimales = (val.toString().split('.')[1] || '').length
        return decimales <= 2
      }, "La cantidad debe tener máximo 2 decimales"),
    precio_unitario: z.number().positive("El precio debe ser mayor a 0"),
    nombre: z.string().min(1)
  }),

  // Categoría
  categoria: z.object({
    nombre: z.string().min(1, "Nombre obligatorio").max(50),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#6B7280')
  }),

  // Venta
  venta: z.object({
    total: z.number().positive("El total debe ser mayor a 0"),
    metodo_pago: z.enum(['efectivo', 'tarjeta', 'fiado'], {
      errorMap: () => ({ message: "Método de pago inválido" })
    }),
    cliente_nombre: z.string().optional()
  }),

  // Apertura de caja
  aperturaCaja: z.object({
    monto_inicial: z.number()
      .nonnegative("El monto inicial no puede ser negativo")
  }),

  // Cierre de caja
  cierreCaja: z.object({
    monto_real: z.number()
      .nonnegative("El monto real no puede ser negativo")
  }),

  // Fiado
  fiado: z.object({
    cliente_nombre: z.string()
      .min(1, "El nombre del cliente es obligatorio"),
    telefono: z.string().optional(),
    monto: z.number().positive("El monto debe ser mayor a 0")
  })
}

// ============================================
// FUNCIÓN HELPER PARA VALIDAR
// ============================================
export const validar = (schema, data) => {
  const resultado = schema.safeParse(data)
  if (!resultado.success) {
    const primerError = resultado.error.errors[0]
    throw new Error(primerError.message)
  }
  return resultado.data
}