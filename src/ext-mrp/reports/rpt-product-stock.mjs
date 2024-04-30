import XLSX from 'xlsx-js-style'
import { makeMoment, printMoment } from '../../packages/utils/moment-utils.mjs'
import path from 'path'
import {
  newSheet,
  setCell,
  setCellFormat,
  setColumnWidth,
  setHeader,
  setTableRow,
  theme
} from '../../packages/utils/xlsx-utils.mjs'

// =================================================================================================================
/** Отчет о производстве партии продукции
 *
  * @param ctx {object} : объект контекста, ожидаем внутри ctx.plan
 * @return {Promise<Awaited<string>>}
 */
export const reportProductStocks = async (ctx) => {
  const app = ctx.app

  const ProductStock = app.exModular.models['MrpProductStock']
  const Plan = app.exModular.models['MrpPlan']

  const rows = await ProductStock.findAll({ where: { type: 'prod' } })

  for( const row of rows ) {
    const plan = await Plan.findById(row.plan)
    const c = {  app, plan, productStock: row }

    await reportProductStock(c)
  }
}

export const reportProductStock = async (ctx) => {
  // проверим контекст
  if (!ctx.app || !ctx.plan || !ctx.productStock) {
    throw new Error(`Report: ctx in invalid. Check for ctx.plan and ctx.productStock exists!`)
  }
  const app = ctx.app

  // получаем API всех нужных объектов в системе
  const Product = app.exModular.models['MrpProduct']
  const Plan = app.exModular.models['MrpPlan']
  const Stage = app.exModular.models['MrpStage']
  const Resource = app.exModular.models['MrpResource']
  const ResourceStock = app.exModular.models['MrpResourceStock']
  const ProductStage = app.exModular.models['MrpProductStage']
  const StageResource = app.exModular.models['MrpStageResource']

  // загружаем сведения о продукции:
  const plan = await Plan.findById(ctx.plan.id)
  // const product = await Product.findById(ctx.plan.product)
  const productStages = await ProductStage.findAll({
    where: { plan: ctx.plan.id }
  })
  const product = await Product.findById(ctx.plan.product)

  // STEP: Create a new workbook
  const wb = XLSX.utils.book_new();

  // STEP: Create worksheet with rows; Add worksheet to workbook
  const ws = newSheet()
  let c = null

  setCell(ws, 0, 0, 'Отчет о производстве партии продукции', theme.H1)
  c = setCell(ws, 1, 0, `${product.caption} (${product.unit})`, theme.H3)
  c.s.font.bold = true
  c = setCell(ws, 2, 0, `${product.comments}`, theme.H3)

  c = setCell(ws, 3, 0, 'План:', theme.Normal)
  c.s.font.bold = true
  c.s.alignment.horizontal = 'right'
  c = setCell(ws, 3, 1, `(#${ctx.plan.id}) от "${printMoment(ctx.plan.date)}"`, theme.Normal)
  c.s.font.bold = true

  c = setCell(ws, 4, 0, 'Количество к производству:', theme.Normal)
  c.s.font.bold = true
  c.s.alignment.horizontal = 'right'
  c = setCell(ws, 4, 1, `${ctx.productStock.qnt}`, theme.Normal)
  c.s.font.bold = true
  setCellFormat(ws, 4, 1, theme.TypeNumber, theme.FormatNumberNoDecimals)

  // настроим сбор итоговых сумм:
  let gtSumm = 0

  // Табличные данные:
  // берем перечень этапов производства:
  let aRow = 5 // текущий номер строки в отчёте
  for (const productStage of productStages) {
    productStage.Stage = await Stage.findById(productStage.stage)
    // запишем заголовок
    let data = [
      `Этап #${productStage.Stage.order}`,
      `${productStage.Stage.caption}`,
      `Дата нач: ${printMoment(productStage.dateStart)}`,
      `Дата ок: ${printMoment(productStage.dateEnd)}`,
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
    aRow += 1

    const resourceStocks = await ResourceStock.findAll({
      where: { type: 'prod', productStage: productStage.id }
    })

    // запишем заголовок:
    data = [
      /* 0 */ 'Ресурс',
      /* 1 */ 'Расход',
      /* 2 */ 'Ед изм',
      /* 3 */ 'Норма расхода',
      /* 4 */ 'База нормы',
      /* 5 */ 'На ед',
      /* 6 */ 'Цена',
      /* 7 */ 'Сумма'
    ]
    setHeader(ws, aRow, 0, data, theme)
    aRow += 1

    // настроим селектор стилей
    let styleSelector = 'FR' // first row, left cell
    if (resourceStocks.length === 1) {
      styleSelector = 'LR'
    }

    // настроим сбор итоговых данных:
    let tSumm = 0
    for (const [index, itm] of resourceStocks.entries()) {
      // встроить связанные сущности:
      itm.Resource = await Resource.findById(itm.resource)
      itm.StageResource = await StageResource.findById(itm.stageResource)

      // сформируем строку отчета:
      data = [
        /* 0 */ `${itm.Resource.caption}`,
        /* 1 */ `${itm.qnt}`,
        /* 2 */ `${itm.Resource.unit}`,
        /* 3 */ `${itm.StageResource.qnt}`,
        /* 4 */ `${itm.StageResource.baseQnt}`,
        /* 5 */ `${itm.StageResource.qnt / itm.StageResource.baseQnt}`,
        /* 6 */ `${itm.price}`,
        /* 7 */ `${itm.price * itm.StageResource.qnt / itm.StageResource.baseQnt}`
      ]
      setTableRow(ws, aRow, 0, data, theme, styleSelector)

      // форматируем табличку дополнительно:
      setCellFormat(ws, aRow, 1, theme.TypeNumber, theme.FormatNumberNoDecimals)
      setCellFormat(ws, aRow, 3, theme.TypeNumber, theme.FormatNumberDecimals)
      setCellFormat(ws, aRow, 4, theme.TypeNumber, theme.FormatNumberDecimals)
      setCellFormat(ws, aRow, 5, theme.TypeNumber, theme.FormatNumberDecimals)
      setCellFormat(ws, aRow, 6, theme.TypeNumber, theme.FormatNumberDecimals)
      setCellFormat(ws, aRow, 7, theme.TypeNumber, theme.FormatNumberDecimals)

      // меняем счётчики
      tSumm += itm.price * itm.StageResource.qnt / itm.StageResource.baseQnt
      aRow += 1

      // настроить селектор стиля ячейки
      styleSelector = 'R'
      if (index === resourceStocks.length - 2) {
        styleSelector = 'LR'
      }
    }

    // Выводим итоговые суммы:
    c = setCell(ws, aRow, 6, 'итого:', theme.Normal)
    c.s.font.bold = true
    c.s.alignment.horizontal = 'right'
    c = setCell(ws, aRow, 7, `${tSumm}`, theme.Normal)
    setCellFormat(ws, aRow, 7, theme.TypeNumber, theme.FormatNumberDecimals)
    c.s.font.bold = true
    c.s.font.underline = true
    c.s.alignment.horizontal = 'right'

    // меняем счётчики:
    aRow += 1
    gtSumm += tSumm
  }

  // выводим общие итоговые суммы:
  c = setCell(ws, aRow, 6, 'ИТОГО:', theme.Normal)
  c.s.font.bold = true
  c.s.alignment.horizontal = 'right'
  c = setCell(ws, aRow, 7, `${gtSumm}`, theme.Normal)
  setCellFormat(ws, aRow, 7, theme.TypeNumber, theme.FormatNumberDecimals)
  c.s.font.bold = true
  c.s.font.underline = true
  c.s.alignment.horizontal = 'right'

  // форматируем ширину столбцов:
  setColumnWidth(ws, 0, 35)
  setColumnWidth(ws, 1, 25)
  setColumnWidth(ws, 2, 12)

  // STEP 4: Write Excel file
  XLSX.utils.book_append_sheet(wb, ws, "Sheet")
  const fileName = path.join(process.env.REPORT_DIR, `report-product-stock-${plan.id}.xlsx`)
  XLSX.writeFile(wb, fileName)

  return Promise.resolve(fileName)
}

