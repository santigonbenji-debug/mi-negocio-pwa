// ============================================
// EXPORT DE VENTAS A EXCEL - VERSIÓN PROFESIONAL
// ============================================

import * as XLSX from 'xlsx-js-style'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const exportarVentas = (ventas, fechaInicio, fechaFin) => {
  // Fechas formateadas
  const ahora = new Date()
  const fechaFormato = format(ahora, 'dd-MM-yyyy_HH-mm', { locale: es })
  const fechaLegible = format(ahora, "dd/MM/yyyy HH:mm", { locale: es })
  const fechaInicioStr = format(new Date(fechaInicio), 'dd/MM/yyyy', { locale: es })
  const fechaFinStr = format(new Date(fechaFin), 'dd/MM/yyyy', { locale: es })

  const data = []

  // ============================================
  // TÍTULO PRINCIPAL
  // ============================================
  data.push([
    {
      v: 'REPORTE DE VENTAS',
      t: 's',
      s: {
        font: { bold: true, sz: 18, color: { rgb: '572364' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    }
  ])

  data.push([
    {
      v: `Del ${fechaInicioStr} al ${fechaFinStr}`,
      t: 's',
      s: {
        font: { sz: 12, bold: true },
        alignment: { horizontal: 'center' }
      }
    }
  ])

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

  data.push([]) // Fila vacía

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
    { v: 'Fecha', t: 's', s: headerStyle },
    { v: 'Hora', t: 's', s: headerStyle },
    { v: 'Vendedor', t: 's', s: headerStyle },
    { v: 'Tipo', t: 's', s: headerStyle },
    { v: 'Método Pago', t: 's', s: headerStyle },
    { v: 'Cliente', t: 's', s: headerStyle },
    { v: 'Total', t: 's', s: headerStyle }
  ])

  // ============================================
  // FILAS DE VENTAS
  // ============================================
  ventas.forEach(venta => {
    // Color según método de pago
    let fillColor = { rgb: 'FFFFFF' }
    if (venta.metodo_pago === 'efectivo') {
      fillColor = { rgb: 'D4EDDA' } // Verde claro
    } else if (venta.metodo_pago === 'tarjeta') {
      fillColor = { rgb: 'D1ECF1' } // Azul claro
    } else if (venta.metodo_pago === 'fiado') {
      fillColor = { rgb: 'FFF3CD' } // Amarillo/naranja claro
    }

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
        v: format(new Date(venta.fecha), 'dd/MM/yyyy', { locale: es }),
        t: 's',
        s: cellStyleCenter
      },
      {
        v: format(new Date(venta.fecha), 'HH:mm', { locale: es }),
        t: 's',
        s: cellStyleCenter
      },
      {
        v: venta.usuarios?.nombre || 'N/A',
        t: 's',
        s: cellStyle
      },
      {
        v: venta.tipo === 'stock' ? 'Producto' : 'Rápida',
        t: 's',
        s: cellStyleCenter
      },
      {
        v: venta.metodo_pago.charAt(0).toUpperCase() + venta.metodo_pago.slice(1),
        t: 's',
        s: cellStyleCenter
      },
      {
        v: venta.cliente_nombre || '-',
        t: 's',
        s: cellStyle
      },
      {
        v: venta.total,
        t: 'n',
        z: '"$"#,##0.00',
        s: cellStyleRight
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

  const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0)
  const efectivo = ventas.filter(v => v.metodo_pago === 'efectivo').reduce((sum, v) => sum + v.total, 0)
  const tarjeta = ventas.filter(v => v.metodo_pago === 'tarjeta').reduce((sum, v) => sum + v.total, 0)
  const fiado = ventas.filter(v => v.metodo_pago === 'fiado').reduce((sum, v) => sum + v.total, 0)
  const cantidad = ventas.length

  const porcentajeEfectivo = totalVentas > 0 ? (efectivo / totalVentas * 100).toFixed(1) : 0
  const porcentajeTarjeta = totalVentas > 0 ? (tarjeta / totalVentas * 100).toFixed(1) : 0
  const porcentajeFiado = totalVentas > 0 ? (fiado / totalVentas * 100).toFixed(1) : 0

  data.push([
    { v: 'Total ventas:', t: 's', s: { ...resumenStyle, font: { bold: true, sz: 12 } } },
    { v: totalVentas, t: 'n', z: '"$"#,##0.00', s: { ...resumenStyle, font: { bold: true, sz: 12 } } }
  ])

  data.push([
    { v: 'Cantidad de ventas:', t: 's', s: { ...resumenStyle, font: { bold: true } } },
    { v: cantidad, t: 'n', s: resumenStyle }
  ])

  data.push([]) // Separador

  data.push([
    { v: `Efectivo (${porcentajeEfectivo}%):`, t: 's', s: { ...resumenStyle, font: { bold: true, color: { rgb: '28A745' } } } },
    { v: efectivo, t: 'n', z: '"$"#,##0.00', s: resumenStyle }
  ])

  data.push([
    { v: `Transferencia (${porcentajeTarjeta}%):`, t: 's', s: { ...resumenStyle, font: { bold: true, color: { rgb: '007BFF' } } } },
    { v: tarjeta, t: 'n', z: '"$"#,##0.00', s: resumenStyle }
  ])

  data.push([
    { v: `Fiado (${porcentajeFiado}%):`, t: 's', s: { ...resumenStyle, font: { bold: true, color: { rgb: 'FFC107' } } } },
    { v: fiado, t: 'n', z: '"$"#,##0.00', s: resumenStyle }
  ])

  // ============================================
  // CREAR LIBRO Y HOJA
  // ============================================
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)

  // Combinar celdas
  const resumenRow = data.length - 6
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Título
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Período
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Fecha export
    { s: { r: resumenRow, c: 0 }, e: { r: resumenRow, c: 6 } } // RESUMEN
  ]

  // Anchos de columna
  ws['!cols'] = [
    { wch: 12 },  // Fecha
    { wch: 8 },   // Hora
    { wch: 20 },  // Vendedor
    { wch: 10 },  // Tipo
    { wch: 12 },  // Método
    { wch: 20 },  // Cliente
    { wch: 12 }   // Total
  ]

  // Altura de filas
  ws['!rows'] = [
    { hpt: 25 }, // Título
    { hpt: 20 }, // Período
    { hpt: 18 }  // Fecha export
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Ventas')
  XLSX.writeFile(wb, `ventas_${fechaFormato}.xlsx`)
}