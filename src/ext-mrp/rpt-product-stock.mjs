// =================================================================================================================
import XLSX from 'xlsx-js-style'
import { makeMoment } from '../packages/utils/moment-utils.mjs'
import path from 'path'
import {
  newSheet,
  setCell,
  setCellFormat,
  setColumnWidth,
  setHeader,
  setTableRow,
  theme
} from '../packages/utils/xlsx-utils.mjs'

/** Отчет о производстве партии продукции
 *
  * @param ctx {object} : объект контекста, ожидаем внутри ctx.plan
 * @return {Promise<Awaited<string>>}
 */
export const reportProductStock = async (ctx) => {
  const app = ctx.app

  // получаем API всех нужных объектов в системе
  const Product = app.exModular.models['MrpProduct']
  const Plan = app.exModular.models['MrpPlan']
  // const Stock = app.exModular.models['MrpProductStock']
  const Stage = app.exModular.models['MrpStage']
  // const StageResource = app.exModular.models['MrpStageResource']
  const Resource = app.exModular.models['MrpResource']
  const ResourceStock = app.exModular.models['MrpResourceStock']
  const ProductStage = app.exModular.models['MrpProductStage']

  // проверим контекст
  if (!ctx.plan || !ctx.productStock) {
    throw new Error(`Report: ctx in invalid. Check for ctx.plan and ctx.productStock exists!`)
  }

  // загружаем сведения о продукции:
  const plan = await Plan.findById(ctx.plan.id)
  const product = await Product.findById(ctx.plan.product)
  const productStages = await ProductStage.findAll({
    where: { plan: ctx.plan.id }
  })

  // STEP: Create a new workbook
  const wb = XLSX.utils.book_new();

  // STEP: Create worksheet with rows; Add worksheet to workbook
  const ws = newSheet()
  let c = null

  setCell(ws, 0, 0, 'Отчет о производстве партии продукции', theme.H1)

  c = setCell(ws, 2, 0, 'План:', theme.Normal)
  c.s.font.bold = true
  c.s.alignment.horizontal = 'right'
  c = setCell(ws, 2, 1, `(#${ctx.plan.id}) от "${makeMoment(ctx.plan.date).format('DD-MM-YYYY')}"`, theme.Normal)
  c.s.font.bold = true

  c = setCell(ws, 3, 0, 'Количество к производству:', theme.Normal)
  c.s.font.bold = true
  c.s.alignment.horizontal = 'right'
  c = setCell(ws, 3, 1, `${ctx.productStock.qnt}`, theme.Normal)
  c.s.font.bold = true
  setCellFormat(ws, 3, 1, theme.TypeNumber, theme.FormatNumberNoDecimals)

  // Табличные данные:
  // берем перечень этапов производства:
  let aRow = 5 // текущий номер строки в отчёте
  for (const productStage of productStages) {
    productStage.Stage = await Stage.findById(productStage.stage)
    // запишем заголовок
    let data = [
      `Этап #${productStage.Stage.order}`,
      `${productStage.Stage.caption}`,
      `Дата нач: ${makeMoment(productStage.dateStart).format('DD-MM-YYYY')}`,
      `Дата ок: ${makeMoment(productStage.dateEnd).format('DD-MM-YYYY')}`,
      `Цена:`,
      `${productStage.price}`
    ]
    c = setCell(ws, aRow, 0, data[0], theme.Normal)
    c.s.font.bold = true
    c = setCell(ws, aRow + 1, 0, data[1], theme.Normal)
    c.s.font.bold = true
    c = setCell(ws, aRow, 1, data[2], theme.Normal)
    c.s.font.bold = true
    c = setCell(ws, aRow, 2, data[3], theme.Normal)
    c.s.font.bold = true
    c = setCell(ws, aRow + 1, 1, data[4], theme.Normal)
    c.s.font.bold = true
    c.s.alignment.horizontal = 'right'
    c = setCell(ws, aRow + 1, 2, data[5], theme.Normal)
    c.s.font.bold = true
    setCellFormat(ws, aRow + 1, 2, theme.TypeNumber, theme.FormatNumberDecimals)

    // setHeader(ws, aRow, 0, data, theme)
    aRow += 2

    // запишем все строки данных о расходе сырья
    c = setCell(ws, aRow, 0, `Расход сырья на этапе:`, theme.Normal)
    const resourceStocks = await ResourceStock.findAll({
      where: { type: 'prod', productStage: productStage.id }
    })

    // запишем заголовок:
    data = [
      'Ресурс',
      'Расход',
      'Норма расхода',
      'База нормы',
      'На ед',
      'Сумма'
    ]
    setHeader(ws, aRow, 0, data, theme)
    aRow += 1

    let styleSelector = 'FR' // first row, left cell
    if (resourceStocks.length === 1) {
      styleSelector = 'LR'
    }
    for (const [index, resourceStock] of resourceStocks.entries()) {
      resourceStock.Resource = await Resource.findById(resourceStock.resource)
      // запишем данные о расходе сырья
      data = [
        `${resourceStock.Resource.caption}`,
        `${resourceStock.qnt}`,
        ``,
        ``,
        '',
        `${resourceStock.price}`
      ]
      setTableRow(ws, aRow, 0, data, theme, styleSelector)
      setCellFormat(ws, aRow, 1, theme.TypeNumber, theme.FormatNumberNoDecimals)
      setCellFormat(ws, aRow, 5, theme.TypeNumber, theme.FormatNumberDecimals)
      aRow += 1

      // настроить селектор стиля ячейки
      styleSelector = 'R'
      if (index === resourceStocks.length - 2) {
        styleSelector = 'LR'
      }
    }
    aRow += 1
  }

  // set column width
  setColumnWidth(ws, 0, 35)
  setColumnWidth(ws, 1, 25)
  setColumnWidth(ws, 2, 12)

  // STEP 4: Write Excel file
  XLSX.utils.book_append_sheet(wb, ws, "Sheet")
  const fileName = path.join(process.env.REPORT_DIR, `report-plan-${plan.id}.xlsx`)
  XLSX.writeFile(wb, fileName)

  return Promise.resolve(fileName)
}

