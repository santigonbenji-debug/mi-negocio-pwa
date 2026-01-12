// ============================================
// EXPORT DE CAJA A EXCEL - 3 HOJAS
// ============================================

import * as XLSX from 'xlsx-js-style'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const exportarCaja = async (caja, ventas, movimientos) => {
  const fechaFormato = format(new Date(caja.fecha_apertura), 'dd-MM-yyyy', { locale: es })
  const ahora = new Date()
  const exportadoEl = format(ahora, "dd/MM/yyyy HH:mm", { locale: es })

  // ============================================
  // HOJA 1: RESUMEN DE CAJA
  // ============================================
  const resumenData = []

  resumenData.push([
    {
      v: `CIERRE DE CAJA - ${fechaFormato}`,
      t: 's',
      s: {
        font: { bold: true, sz: 18, color: { rgb: '572364' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    }
  ])

  resumenData.push([
    {
      v: `Responsable: ${caja.usuarios?.nombre || 'N/A'}`,
      t: 's',
      s: {
        font: { sz: 12, bold: true },
        alignment: { horizontal: 'center' }
      }
    }
  ])

  resumenData.push([
    {
      v: `Exportado el: ${exportadoEl}`,
      t: 's',
      s: {
        font: { sz: 11, italic: true },
        alignment: { horizontal: 'center' }
      }
    }
  ])

  resumenData.push([])

  const infoStyle = {
    font: { sz: 11 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'DDDDDD' } },
      bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
      left: { style: 'thin', color: { rgb: 'DDDDDD' } },
      right: { style: 'thin', color: { rgb: 'DDDDDD' } }
    }
  }

  resumenData.push([
    { v: 'Fecha y hora de apertura:', t: 's', s: { ...infoStyle, font: { bold: true } } },
    { v: format(new Date(caja.fecha_apertura), 'dd/MM/yyyy HH:mm', { locale: es }), t: 's', s: infoStyle }
  ])

  if (caja.fecha_cierre) {
    resumenData.push([
      { v: 'Fecha y hora de cierre:', t: 's', s: { ...infoStyle, font: { bold: true } } },
      { v: format(new Date(caja.fecha_cierre), 'dd/MM/yyyy HH:mm', { locale: es }), t: 's', s: infoStyle }
    ])
  }

  resumenData.push([])

  resumenData.push([
    { v: 'Monto inicial:', t: 's', s: { ...infoStyle, font: { bold: true } } },
    { v: caja.monto_inicial, t: 'n', z: '"$"#,##0.00', s: infoStyle }
  ])

  resumenData.push([
    { v: 'Monto esperado:', t: 's', s: { ...infoStyle, font: { bold: true } } },
    { v: caja.monto_esperado || 0, t: 'n', z: '"$"#,##0.00', s: infoStyle }
  ])

  if (caja.monto_real !== null) {
    resumenData.push([
      { v: 'Monto real:', t: 's', s: { ...infoStyle, font: { bold: true } } },
      { v: caja.monto_real, t: 'n', z: '"$"#,##0.00', s: infoStyle }
    ])

    const diferencia = caja.diferencia || 0
    const diferenciaColor = diferencia === 0 ? { rgb: '28A745' } : diferencia > 0 ? { rgb: '007BFF' } : { rgb: 'DC3545' }

    resumenData.push([
      { v: 'Diferencia:', t: 's', s: { ...infoStyle, font: { bold: true } } },
      { v: diferencia, t: 'n', z: '"$"#,##0.00', s: { ...infoStyle, font: { bold: true, color: diferenciaColor } } }
    ])
  }

  resumenData.push([])

  resumenData.push([
    {
      v: 'DESGLOSE',
      t: 's',
      s: {
        font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '6C757D' } },
        alignment: { horizontal: 'center' }
      }
    }
  ])

  resumenData.push([
    { v: 'Efectivo:', t: 's', s: { ...infoStyle, font: { bold: true, color: { rgb: '28A745' } } } },
    { v: caja.efectivo || 0, t: 'n', z: '"$"#,##0.00', s: infoStyle }
  ])

  resumenData.push([
    { v: 'Tarjeta:', t: 's', s: { ...infoStyle, font: { bold: true, color: { rgb: '007BFF' } } } },
    { v: caja.tarjeta || 0, t: 'n', z: '"$"#,##0.00', s: infoStyle }
  ])

  resumenData.push([
    { v: 'Fiado:', t: 's', s: { ...infoStyle, font: { bold: true, color: { rgb: 'FFC107' } } } },
    { v: caja.fiado || 0, t: 'n', z: '"$"#,##0.00', s: infoStyle }
  ])

  if (caja.observaciones) {
    resumenData.push([])
    resumenData.push([
      { v: 'Observaciones:', t: 's', s: { ...infoStyle, font: { bold: true } } },
      { v: caja.observaciones, t: 's', s: infoStyle }
    ])
  }

  // ============================================
  // HOJA 2: VENTAS
  // ============================================
  const ventasData = []

  ventasData.push([
    {
      v: `VENTAS DEL ${fechaFormato}`,
      t: 's',
      s: {
        font: { bold: true, sz: 16, color: { rgb: '572364' } },
        alignment: { horizontal: 'center' }
      }
    }
  ])

  ventasData.push([])

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

  ventasData.push([
    { v: 'Hora', t: 's', s: headerStyle },
    { v: 'Método', t: 's', s: headerStyle },
    { v: 'Cliente', t: 's', s: headerStyle },
    { v: 'Total', t: 's', s: headerStyle },
    { v: 'ID', t: 's', s: headerStyle }
  ])

  ventas.forEach(venta => {
    let fillColor = { rgb: 'FFFFFF' }
    if (venta.metodo_pago === 'efectivo') fillColor = { rgb: 'D4EDDA' }
    else if (venta.metodo_pago === 'tarjeta') fillColor = { rgb: 'D1ECF1' }
    else if (venta.metodo_pago === 'fiado') fillColor = { rgb: 'FFF3CD' }

    const cellStyle = {
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'DDDDDD' } },
        bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
        left: { style: 'thin', color: { rgb: 'DDDDDD' } },
        right: { style: 'thin', color: { rgb: 'DDDDDD' } }
      },
      fill: { fgColor: fillColor }
    }

    ventasData.push([
      { v: format(new Date(venta.fecha), 'HH:mm', { locale: es }), t: 's', s: cellStyle },
      { v: venta.metodo_pago.charAt(0).toUpperCase() + venta.metodo_pago.slice(1), t: 's', s: cellStyle },
      { v: venta.cliente_nombre || '-', t: 's', s: cellStyle },
      { v: venta.total, t: 'n', z: '"$"#,##0.00', s: { ...cellStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
      { v: `#${venta.id.slice(0, 8)}`, t: 's', s: cellStyle }
    ])
  })

  ventasData.push([])
  const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0)
  ventasData.push([
    { v: `Total: ${ventas.length} ventas`, t: 's', s: { ...infoStyle, font: { bold: true } } },
    {},
    {},
    { v: totalVentas, t: 'n', z: '"$"#,##0.00', s: { ...infoStyle, font: { bold: true }, alignment: { horizontal: 'right' } } }
  ])

  // ============================================
  // HOJA 3: MOVIMIENTOS
  // ============================================
  const movimientosData = []

  movimientosData.push([
    {
      v: `MOVIMIENTOS DE CAJA - ${fechaFormato}`,
      t: 's',
      s: {
        font: { bold: true, sz: 16, color: { rgb: '572364' } },
        alignment: { horizontal: 'center' }
      }
    }
  ])

  movimientosData.push([])

  movimientosData.push([
    { v: 'Hora', t: 's', s: headerStyle },
    { v: 'Tipo', t: 's', s: headerStyle },
    { v: 'Concepto', t: 's', s: headerStyle },
    { v: 'Monto', t: 's', s: headerStyle }
  ])

  let totalIngresos = 0
  let totalGastos = 0

  movimientos.forEach(mov => {
    let fillColor = { rgb: 'D4EDDA' } // Verde
    if (mov.tipo === 'egreso' || mov.tipo === 'gasto') {
      fillColor = { rgb: 'F8D7DA' } // Rojo
      totalGastos += parseFloat(mov.monto)
    } else {
      totalIngresos += parseFloat(mov.monto)
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

    movimientosData.push([
      { v: format(new Date(mov.fecha), 'HH:mm', { locale: es }), t: 's', s: { ...cellStyle, alignment: { horizontal: 'center' } } },
      { v: mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1), t: 's', s: { ...cellStyle, alignment: { horizontal: 'center' } } },
      { v: mov.concepto, t: 's', s: cellStyle },
      { v: mov.tipo === 'ingreso' ? parseFloat(mov.monto) : -parseFloat(mov.monto), t: 'n', z: '"$"#,##0.00', s: { ...cellStyle, alignment: { horizontal: 'right' } } }
    ])
  })

  movimientosData.push([])
  movimientosData.push([
    { v: 'Total Ingresos:', t: 's', s: { ...infoStyle, font: { bold: true, color: { rgb: '28A745' } } } },
    {},
    {},
    { v: totalIngresos, t: 'n', z: '"$"#,##0.00', s: { ...infoStyle, alignment: { horizontal: 'right' } } }
  ])

  movimientosData.push([
    { v: 'Total Gastos:', t: 's', s: { ...infoStyle, font: { bold: true, color: { rgb: 'DC3545' } } } },
    {},
    {},
    { v: -totalGastos, t: 'n', z: '"$"#,##0.00', s: { ...infoStyle, alignment: { horizontal: 'right' } } }
  ])

  // ============================================
  // CREAR LIBRO CON 3 HOJAS
  // ============================================
  const wb = XLSX.utils.book_new()

  // HOJA 1
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
  wsResumen['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    { s: { r: resumenData.length - (caja.observaciones ? 8 : 6), c: 0 }, e: { r: resumenData.length - (caja.observaciones ? 8 : 6), c: 1 } }
  ]
  wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }]
  wsResumen['!rows'] = [{ hpt: 25 }, { hpt: 20 }]

  // HOJA 2
  const wsVentas = XLSX.utils.aoa_to_sheet(ventasData)
  wsVentas['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]
  wsVentas['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 }]

  // HOJA 3
  const wsMovimientos = XLSX.utils.aoa_to_sheet(movimientosData)
  wsMovimientos['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]
  wsMovimientos['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 35 }, { wch: 12 }]

  XLSX.utils.book_append_sheet(wb, wsResumen, '1. Resumen')
  XLSX.utils.book_append_sheet(wb, wsVentas, '2. Ventas')
  XLSX.utils.book_append_sheet(wb, wsMovimientos, '3. Movimientos')

  XLSX.writeFile(wb, `caja_${fechaFormato}.xlsx`)
}