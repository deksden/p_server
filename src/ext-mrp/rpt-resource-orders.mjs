// import _ from 'lodash'
import XLSX from 'xlsx-js-style'
import { makeMoment, printMoment } from '../packages/utils/moment-utils.mjs'
import path from 'path'
import {
  newSheet,
  setCell,
  setCellFormat,
  setColumnWidth,
  setHeader, setStyle,
  setTableRow,
  theme
} from '../packages/utils/xlsx-utils.mjs'

/** Отчёт о запланированных закупках ресурсов
 *
 * @param ctx {object} : нужен только объект app и plan
 * @return {Promise<Awaited<string>>}
 */
export const reportResourceOrders = async (ctx) => {
  // проверим контекст
  if (!ctx.app) {
    throw new Error(`Report: ctx in invalid. Check required properties!`)
  }

  const app = ctx.app

  // получаем API всех нужных объектов в системе
  const ResourceStock = app.exModular.models['MrpResourceStock']
  const Resource = app.exModular.models['MrpResource']
  const Vendor = app.exModular.models['MrpVendor']

  // STEP: Create a new workbook
  const wb = XLSX.utils.book_new();

  // STEP: Create worksheet with rows; Add worksheet to workbook
  const ws = newSheet()
  let c = null

  // STEP: ШАПКА ОТЧЁТА
  c = setCell(ws, 0,0, 'Ведомость запланированных заказов ресурсов', theme.H1)

  if (ctx.plan.id) {
    c = setCell(ws,  1, 0, `План:`, theme.Normal)
    c.s.font.bold = true
    c.s.alignment.horizontal = 'right'
    c = setCell(ws,  1, 1, `#${ctx.plan.id}`, theme.Normal)
    c.s.font.bold = true
  }

  if (ctx.plan.date) {
    c = setCell(ws, 2, 0, `Дата:`, theme.Normal)
    c.s.font.bold = true
    c.s.alignment.horizontal = 'right'
    c = setCell(ws, 2, 1, `${makeMoment(ctx.plan.date).format('DD-MM-YYYY')}`, theme.Normal)
    c.s.font.bold = true
  }

  // получим заказы:
  const rows = await ResourceStock.findAll({
    where: { type: 'order' },
    orderBy: ['dateOrder','resource']
  })

  // const daysLabel = product.inWorkingDays ? 'р.д.' : 'д'

  // Табличные данные:
  // берем перечень этапов производства:
  let aRow = 5 // текущий номер строки в отчёте

  // запишем заголовок
  let data = [
    /* 0 */ `Дата заказа`,
    /* 1 */ `Ресурс`,
    /* 2 */ `Ед изм`,
    /* 3 */ `Кол-во`,
    /* 4 */ `Потребность`,
    /* 5 */ `Цена`,
    /* 6 */ `Сумма`,
    /* 7 */ `Поставщик`,
    /* 8 */ `Дата поставки`,
    /* 9 */ `Дата про-ва`,
    /* 10*/ `Дата годности`
  ]
  setHeader(ws, aRow, 0, data, theme)
  aRow += 1

  // настроить селекторы стиля:
  let rts = 'FR'
  if (rows.length === 1) rts = 'LR'

  // настроить аккумуляторы итогов:
  let gtSumm = 0

  // в цикле вывести все строки:
  for (const [ndx, row] of rows.entries()) {
    // развернуть необходимые объекты в строку:
    row.Resource = await Resource.findById(row.resource)
    row.Vendor = await Vendor.findById(row.vendor)

    // сформируем строку для вывода
    data = [
      /* 0 */ `${printMoment(row.dateOrder)}`,
      /* 1 */ `${row.Resource.caption}`,
      /* 2 */ `${row.Resource.unit}`,
      /* 3 */ `${row.qnt}`,
      /* 4 */ `${row.qntReq}`,
      /* 5 */ `${row.price}`,
      /* 6 */ `${row.price * row.qnt}`,
      /* 7 */ `${row.Vendor.caption}`,
      /* 8 */ `${printMoment(row.date)}`,
      /* 9 */ `${printMoment(row.dateProd)}`,
      /* 10*/ `${printMoment(row.dateExp)}`,
    ]
    setTableRow(ws, aRow,0, data, theme, rts)

    setCellFormat(ws, aRow, 3, theme.TypeNumber, theme.FormatNumberDecimals)
    setCellFormat(ws, aRow, 4, theme.TypeNumber, theme.FormatNumberDecimals)
    setCellFormat(ws, aRow, 5, theme.TypeNumber, theme.FormatNumberDecimals)
    setCellFormat(ws, aRow, 6, theme.TypeNumber, theme.FormatNumberDecimals)
    aRow += 1

    // настроить селектор стиля ячейки
    rts = 'R'
    if (ndx === rows.length-2) rts = 'LR'

    gtSumm += (row.price * row.qnt)
  }

  c = setCell(ws, aRow, 5, 'ИТОГО:', theme.Normal)
  c.s.font.bold = true
  c.s.alignment.horizontal = 'right'
  c = setCell(ws, aRow, 6, `${gtSumm}`, theme.Normal)
  setCellFormat(ws, aRow, 6, theme.TypeNumber, theme.FormatNumberDecimals)
  c.s.font.bold = true
  c.s.font.underline = true
  c.s.alignment.horizontal = 'right'

  // set column width
  setColumnWidth(ws, 0, 11)
  setColumnWidth(ws, 1, 35)
  setColumnWidth(ws, 2, 12)
  setColumnWidth(ws, 3, 12)
  setColumnWidth(ws, 4, 12)
  setColumnWidth(ws, 5, 11)
  setColumnWidth(ws, 6, 16)
  setColumnWidth(ws, 7, 16)
  setColumnWidth(ws, 8, 12)
  setColumnWidth(ws, 9, 12)
  setColumnWidth(ws, 10, 12)

  // STEP 4: Write Excel file
  XLSX.utils.book_append_sheet(wb, ws, "Sheet")
  const fileName = path.join(process.env.REPORT_DIR, `resource-orders.xlsx`)
  XLSX.writeFile(wb, fileName)

  return Promise.resolve(fileName)
}
