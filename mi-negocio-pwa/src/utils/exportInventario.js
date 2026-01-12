// ============================================
// EXPORT DE INVENTARIO A EXCEL - VERSIÓN PROFESIONAL
// Con colores, negritas, bordes y formato
// ============================================

import * as XLSX from 'xlsx-js-style'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const exportarInventario = (productos) => {
  // Fecha actual
  const ahora = new Date()
  const fechaFormato = format(ahora, 'dd-MM-yyyy_HH-mm', { locale: es })
  const fechaLegible = format(ahora, "dd/MM/yyyy HH:mm", { locale: es })

  // Crear array de datos con estilos
  const data = []

  // ============================================
  // TÍTULO PRINCIPAL
  // ============================================
  data.push([
    {
      v: 'INVENTARIO COMPLETO',
      t: 's',
      s: {
        font: { bold: true, sz: 18, color: { rgb: '572364' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    }
  ])

  // FECHA DE EXPORTACIÓN
  data.push([
    {
      v: `Exportado el: ${fechaLegible}`,
      t: 's',
      s: {
        font: { sz: 11, italic: true },
        alignment: { horizontal: 'center' }
      }
    }
  ])

  // FILA VACÍA
  data.push([])

  // ============================================
  // ENCABEZADO DE TABLA
  // ============================================
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
    fill: { fgColor: { rgb: '572364' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    }
  }

  data.push([
    { v: 'Código', t: 's', s: headerStyle },
    { v: 'Producto', t: 's', s: headerStyle },
    { v: 'Precio', t: 's', s: headerStyle },
    { v: 'Stock Actual', t: 's', s: headerStyle },
    { v: 'Stock Mínimo', t: 's', s: headerStyle },
    { v: 'Estado', t: 's', s: headerStyle }
  ])

  // ============================================
  // FILAS DE PRODUCTOS
  // ============================================
  productos.forEach((producto, index) => {
    // Determinar estado y color de fila
    let estado = 'Normal'
    let estadoColor = { rgb: '28A745' } // Verde
    let fillColor = { rgb: 'FFFFFF' } // Blanco

    if (!producto.activo) {
      estado = 'Inactivo'
      estadoColor = { rgb: '6C757D' } // Gris
      fillColor = { rgb: 'E9ECEF' } // Gris claro
    } else if (producto.stock_actual <= 0) {
      estado = 'Sin Stock'
      estadoColor = { rgb: 'DC3545' } // Rojo
      fillColor = { rgb: 'F8D7DA' } // Rojo claro
    } else if (producto.stock_actual <= producto.stock_minimo) {
      estado = 'Stock Bajo ⚠'
      estadoColor = { rgb: 'FFC107' } // Amarillo
      fillColor = { rgb: 'FFF3CD' } // Amarillo claro
    }

    // Estilo base para celdas
    const cellStyle = {
      alignment: { horizontal: 'left', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'DDDDDD' } },
        bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
        left: { style: 'thin', color: { rgb: 'DDDDDD' } },
        right: { style: 'thin', color: { rgb: 'DDDDDD' } }
      },
      fill: { fgColor: fillColor }
    }

    const cellStyleCenter = {
      ...cellStyle,
      alignment: { horizontal: 'center', vertical: 'center' }
    }

    const cellStyleRight = {
      ...cellStyle,
      alignment: { horizontal: 'right', vertical: 'center' }
    }

    data.push([
      {
        v: producto.codigo_barras || `P${String(index + 1).padStart(3, '0')}`,
        t: 's',
        s: cellStyleCenter
      },
      {
        v: producto.nombre,
        t: 's',
        s: cellStyle
      },
      {
        v: producto.precio,
        t: 'n',
        z: '"$"#,##0.00',
        s: cellStyleRight
      },
      {
        v: producto.stock_actual,
        t: 'n',
        s: cellStyleCenter
      },
      {
        v: producto.stock_minimo,
        t: 'n',
        s: cellStyleCenter
      },
      {
        v: estado,
        t: 's',
        s: {
          ...cellStyleCenter,
          font: { bold: true, color: estadoColor }
        }
      }
    ])
  })

  // ============================================
  // RESUMEN
  // ============================================
  data.push([]) // Fila vacía

  const resumenHeaderStyle = {
    font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '6C757D' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  }

  data.push([
    {
      v: 'RESUMEN',
      t: 's',
      s: resumenHeaderStyle
    }
  ])

  const resumenStyle = {
    font: { sz: 11 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'DDDDDD' } },
      bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
      left: { style: 'thin', color: { rgb: 'DDDDDD' } },
      right: { style: 'thin', color: { rgb: 'DDDDDD' } }
    }
  }

  const totalProductos = productos.length
  const productosActivos = productos.filter(p => p.activo).length
  const productosStockBajo = productos.filter(p => p.activo && p.stock_actual <= p.stock_minimo).length
  const valorTotalInventario = productos
    .filter(p => p.activo)
    .reduce((sum, p) => sum + (p.precio * p.stock_actual), 0)

  data.push([
    { v: 'Total productos:', t: 's', s: { ...resumenStyle, font: { bold: true } } },
    { v: totalProductos, t: 'n', s: resumenStyle }
  ])

  data.push([
    { v: 'Productos activos:', t: 's', s: { ...resumenStyle, font: { bold: true } } },
    { v: productosActivos, t: 'n', s: resumenStyle }
  ])

  data.push([
    { v: 'Productos con stock bajo:', t: 's', s: { ...resumenStyle, font: { bold: true } } },
    { v: productosStockBajo, t: 'n', s: resumenStyle }
  ])

  data.push([
    { v: 'Valor total del inventario:', t: 's', s: { ...resumenStyle, font: { bold: true } } },
    { v: valorTotalInventario, t: 'n', z: '"$"#,##0.00', s: resumenStyle }
  ])

  // ============================================
  // CREAR LIBRO Y HOJA
  // ============================================
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)

  // Combinar celdas para el título
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Título
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Fecha
    { s: { r: data.length - 5, c: 0 }, e: { r: data.length - 5, c: 5 } } // RESUMEN
  ]

  // Ajustar anchos de columna
  ws['!cols'] = [
    { wch: 10 },  // Código
    { wch: 35 },  // Producto
    { wch: 12 },  // Precio
    { wch: 12 },  // Stock Actual
    { wch: 12 },  // Stock Mínimo
    { wch: 15 }   // Estado
  ]

  // Ajustar altura de filas
  ws['!rows'] = [
    { hpt: 25 }, // Título
    { hpt: 18 }  // Fecha
  ]

  // Agregar hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario')

  // Descargar archivo
  XLSX.writeFile(wb, `inventario_${fechaFormato}.xlsx`)
}