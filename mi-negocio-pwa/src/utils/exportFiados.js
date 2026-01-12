// ============================================
// EXPORT DE FIADOS A EXCEL - VERSIÓN PROFESIONAL
// ============================================

import * as XLSX from 'xlsx-js-style'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const exportarFiados = (clientes) => {
  const ahora = new Date()
  const fechaFormato = format(ahora, 'dd-MM-yyyy_HH-mm', { locale: es })
  const fechaLegible = format(ahora, "dd/MM/yyyy HH:mm", { locale: es })

  const data = []

  // ============================================
  // TÍTULO
  // ============================================
  data.push([
    {
      v: 'CLIENTES FIADOS',
      t: 's',
      s: {
        font: { bold: true, sz: 18, color: { rgb: '572364' } },
        alignment: { horizontal: 'center', vertical: 'center' }
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

  data.push([])

  // ============================================
  // ENCABEZADO
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
    { v: 'Cliente', t: 's', s: headerStyle },
    { v: 'Teléfono', t: 's', s: headerStyle },
    { v: 'Deuda Total', t: 's', s: headerStyle },
    { v: 'Última Compra', t: 's', s: headerStyle }
  ])

  // ============================================
  // FILAS DE CLIENTES
  // ============================================
  clientes.forEach(cliente => {
    // Color según deuda
    let fillColor = { rgb: 'D4EDDA' } // Verde claro (sin deuda)
    if (cliente.deuda_total > 0) {
      if (cliente.deuda_total > 1000) {
        fillColor = { rgb: 'F8D7DA' } // Rojo claro (deuda alta)
      } else {
        fillColor = { rgb: 'FFF3CD' } // Amarillo claro (deuda media)
      }
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
        v: cliente.cliente_nombre,
        t: 's',
        s: cellStyle
      },
      {
        v: cliente.telefono || '-',
        t: 's',
        s: cellStyleCenter
      },
      {
        v: cliente.deuda_total || 0,
        t: 'n',
        z: '"$"#,##0.00',
        s: cellStyleRight
      },
      {
        v: format(new Date(cliente.creado_en), 'dd/MM/yyyy', { locale: es }),
        t: 's',
        s: cellStyleCenter
      }
    ])
  })

  // ============================================
  // RESUMEN
  // ============================================
  data.push([])

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

  const totalClientes = clientes.length
  const clientesConDeuda = clientes.filter(c => c.deuda_total > 0).length
  const deudaTotal = clientes.reduce((sum, c) => sum + (c.deuda_total || 0), 0)

  data.push([
    { v: 'Total clientes:', t: 's', s: { ...resumenStyle, font: { bold: true } } },
    { v: totalClientes, t: 'n', s: resumenStyle }
  ])

  data.push([
    { v: 'Clientes con deuda:', t: 's', s: { ...resumenStyle, font: { bold: true } } },
    { v: clientesConDeuda, t: 'n', s: resumenStyle }
  ])

  data.push([
    { v: 'Deuda total:', t: 's', s: { ...resumenStyle, font: { bold: true, sz: 12, color: { rgb: 'DC3545' } } } },
    { v: deudaTotal, t: 'n', z: '"$"#,##0.00', s: { ...resumenStyle, font: { bold: true, sz: 12 } } }
  ])

  // ============================================
  // CREAR LIBRO
  // ============================================
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)

  const resumenRow = data.length - 4
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Título
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Fecha
    { s: { r: resumenRow, c: 0 }, e: { r: resumenRow, c: 3 } } // RESUMEN
  ]

  ws['!cols'] = [
    { wch: 25 },  // Cliente
    { wch: 15 },  // Teléfono
    { wch: 12 },  // Deuda
    { wch: 12 }   // Última compra
  ]

  ws['!rows'] = [
    { hpt: 25 },
    { hpt: 18 }
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Fiados')
  XLSX.writeFile(wb, `fiados_${fechaFormato}.xlsx`)
}