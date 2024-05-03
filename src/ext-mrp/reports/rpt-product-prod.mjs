// import _ from 'lodash'
import XLSX from 'xlsx-js-style'
import { makeMoment, printMoment } from '../../packages/utils/moment-utils.mjs'
import path from 'path'
import {
  newSheet,
  setCell,
  setCellFormat,
  setColumnWidth,
  setHeader, setStyle,
  setTableRow,
  theme
} from '../../packages/utils/xlsx-utils.mjs'

/** Отчёт о произведенных партиях продукции
 *
 * @param ctx {object} : нужен только объект app и plan
 * @return {Promise<Awaited<string>>}
 */
export const reportProductProd = async (ctx) => {
  // проверим контекст
  if (!ctx.app) {
    throw new Error(`Report: ctx in invalid. Check required properties!`)
  }

  const app = ctx.app

  // получаем API всех нужных объектов в системе
  const ProductStock = app.exModular.models['MrpProductStock']
  const Product = app.exModular.models['MrpProduct']
  const Plan = app.exModular.models['MrpPlan']

  // const ResourceStock = app.exModular.models['MrpResourceStock']
  // const Resource = app.exModular.models['MrpResource']
  // const Vendor = app.exModular.models['MrpVendor']

  // STEP: Create a new workbook
  const wb = XLSX.utils.book_new();

  // STEP: Create worksheet with rows; Add worksheet to workbook
  const ws = newSheet()
  let c = null

  // STEP: ШАПКА ОТЧЁТА
  c = setCell(ws, 0,0, 'Ведомость произведенных партий продукции', theme.H1)

  let aRow = 1 // текущий номер строки в отчёте
  if (ctx.plan && ctx.plan.id) {
    c = setCell(ws,  aRow, 0, `План:`, theme.Normal)
    c.s.font.bold = true
    c.s.alignment.horizontal = 'right'
    c = setCell(ws,  aRow, 1, `#${ctx.plan.id}`, theme.Normal)
    c.s.font.bold = true
    aRow += 1
  }

  if (ctx.plan && ctx.plan.date) {
    c = setCell(ws, aRow, 0, `Дата:`, theme.Normal)
    c.s.font.bold = true
    c.s.alignment.horizontal = 'right'
    c = setCell(ws, aRow, 1, `${makeMoment(ctx.plan.date).format('DD-MM-YYYY')}`, theme.Normal)
    c.s.font.bold = true
    aRow += 1
  }

  // получим табличку:
  const rows = await ProductStock.findAll({
    where: { type: 'prod' },
    orderBy: ['date','product']
  })

  aRow += 1

  // запишем заголовок
  let data = [
    /* 0 */ `Дата`,
    /* 1 */ `Продукт`,
    /* 2 */ `План, шт`,
    /* 3 */ `Произведено, шт`,
    /* 4 */ `Себестоимость`,
  ]
  setHeader(ws, aRow, 0, data, theme)
  aRow += 1

  // настроить селекторы стиля:
  let rts = 'FR'
  if (rows.length === 1) rts = 'LR'

  // настроить аккумуляторы итогов:
  // let gtSumm = 0

  // в цикле вывести все строки:
  for (const [ndx, row] of rows.entries()) {
    // развернуть необходимые объекты в строку:
    row.Product = await Product.findById(row.product)
    row.Plan = await Plan.findById(row.plan)

    // сформируем строку для вывода
    data = [
      /* 0 */ `${printMoment(row.date)}`,
      /* 1 */ `${row.Product.caption}`,
      /* 2 */ `${row.Plan.qnt}`,
      /* 3 */ `${row.qnt}`,
      /* 4 */ `${row.price}`,
    ]
    setTableRow(ws, aRow,0, data, theme, rts)

    setCellFormat(ws, aRow, 2, theme.TypeNumber, theme.FormatNumberDecimals)
    setCellFormat(ws, aRow, 3, theme.TypeNumber, theme.FormatNumberDecimals)
    setCellFormat(ws, aRow, 4, theme.TypeNumber, theme.FormatNumberDecimals)
    aRow += 1

    // настроить селектор стиля ячейки
    rts = 'R'
    if (ndx === rows.length-2) rts = 'LR'

    // gtSumm += (row.price * row.qnt)
  }

  // c = setCell(ws, aRow, 5, 'ИТОГО:', theme.Normal)
  // c.s.font.bold = true
  // c.s.alignment.horizontal = 'right'
  // c = setCell(ws, aRow, 6, `${gtSumm}`, theme.Normal)
  // setCellFormat(ws, aRow, 6, theme.TypeNumber, theme.FormatNumberDecimals)
  // c.s.font.bold = true
  // c.s.font.underline = true
  // c.s.alignment.horizontal = 'right'

  // set column width
  setColumnWidth(ws, 0, 12)
  setColumnWidth(ws, 1, 35)
  setColumnWidth(ws, 2, 16)
  setColumnWidth(ws, 3, 16)
  setColumnWidth(ws, 4, 14)

  // STEP 4: Write Excel file
  XLSX.utils.book_append_sheet(wb, ws, "Sheet")
  const fileName = path.join(process.env.REPORT_DIR, `product-prod.xlsx`)
  XLSX.writeFile(wb, fileName)

  return Promise.resolve(fileName)
}
