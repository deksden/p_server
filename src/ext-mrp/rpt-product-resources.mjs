import _ from 'lodash'
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

/** Отчёт о нормах расхода сырья на выпуск продукта
 *
 * @param ctx {object} : нужен только объект product
 * @return {Promise<Awaited<string>>}
 */
export const reportProductResources = async (ctx) => {
  const app = ctx.app
  // получаем API всех нужных объектов в системе
  const Product = app.exModular.models['MrpProduct']
  // const Plan = app.exModular.models['MrpPlan']
  // const Stock = app.exModular.models['MrpProductStock']
  const Stage = app.exModular.models['MrpStage']
  const StageResource = app.exModular.models['MrpStageResource']
  const Resource = app.exModular.models['MrpResource']
  // const ResourceStock = app.exModular.models['MrpResourceStock']
  // const ProductStage = app.exModular.models['MrpProductStage']

  // проверим контекст
  if (!ctx.product) {
    throw new Error(`Report: ctx in invalid. Check required properties!`)
  }

  let product = null
  // загружаем сведения о продукции:
  if (!ctx.product.id && !ctx.product.caption) {
    // нам дали не продукт в контексте, а его код
    product = await Product.findById(ctx.product)
  } else {
    // в контексте лежит полное описание продукта
    product = _.clone(ctx.product)
  }

  // STEP: Create a new workbook
  const wb = XLSX.utils.book_new();

  // STEP: Create worksheet with rows; Add worksheet to workbook
  const ws = newSheet()
  let c = null

  // STEP: ШАПКА ОТЧЁТА
  c = setCell(ws, 0,0, 'Нормы расхода сырья и материалов', theme.H1)

  c = setCell(ws,  1, 0, `Продукция:`, theme.Normal)
  c.s.font.bold = true
  c.s.alignment.horizontal = 'right'
  c = setCell(ws,  1, 1, `${product.caption}`, theme.Normal)
  c.s.font.bold = true

  c = setCell(ws,  2, 0, `Дата:`, theme.Normal)
  c.s.font.bold = true
  c.s.alignment.horizontal = 'right'
  c = setCell(ws,  2, 1, `${makeMoment(product.date).format('DD-MM-YYYY')}`, theme.Normal)
  c.s.font.bold = true

  c = setCell(ws,  3, 0, `Ед:`, theme.Normal)
  c.s.font.bold = true
  c.s.alignment.horizontal = 'right'
  c = setCell(ws,  3, 1, `${product.unit}`, theme.Normal)
  c.s.font.bold = true

  // получим этапы:
  const stages = await Stage.findAll({
    where: { product: product.id },
    orderBy: ['order']
  })

  const daysLabel = product.inWorkingDays ? 'р.д.' : 'д'

  // Табличные данные:
  // берем перечень этапов производства:
  let aRow = 5 // текущий номер строки в отчёте
  for (const stage of stages) {
    // запишем заголовок
    // let data = [
    //   `Этап #${stage.order}`,
    //   `${stage.caption}`,
    //   `Дл: ${stage.duration} ${daysLabel}`,
    //   `${stage.comments}`
    // ]
    // setHeader(ws, aRow, 0, data, theme)
    c = setCell(ws, aRow, 0, `Этап #${stage.order}`, theme.Normal)
    c.s.font.bold = true
    c = setCell(ws, aRow+1, 0, `${stage.caption}`, theme.Normal)
    c.s.font.bold = true
    c = setCell(ws, aRow, 1, `Длит.: ${stage.duration} ${daysLabel}`, theme.Normal)
    c.s.font.bold = true
    c = setCell(ws, aRow+1, 1, `${stage.comments}`, theme.Normal)
    c.s.font.bold = true
    aRow += 2

    // запишем все строки данных о расходе сырья
    const stageResources = await StageResource.findAll({
      where: { stage: stage.id }
    })

    // запишем заголовок:
    let data = [
      'Ресурс',
      'Норма расх',
      'База нормы',
      'На 1 шт',
      'Цена'
    ]
    setHeader(ws,aRow, 0, data, theme)
    // c = setCell(ws, aRow, 0, 'Ресурс', theme.Normal)
    // c = setCell(ws, aRow, 1, 'Норма', theme.Normal)
    // c = setCell(ws, aRow, 2, 'база нормы', theme.Normal)
    // c = setCell(ws, aRow, 3, 'На ед', theme.Normal)
    // c = setCell(ws, aRow, 4, 'Цена', theme.Normal)
    aRow += 1

    let rts = 'FR'
    if (stageResources.length === 1) rts = 'LR'

    for (const [ndx, stageResource] of stageResources.entries()) {
      stageResource.Resource = await Resource.findById(stageResource.resource)
      // запишем данные о расходе сырья
      data = [
        `${stageResource.Resource.caption}`,
        `${stageResource.qnt}`,
        ``,
        ``,
        `${stageResource.price}`
      ]
      setTableRow(ws,aRow,0,data,theme,rts)
      setCellFormat(ws, aRow, 1, theme.TypeNumber, theme.FormatNumberDecimals)
      setCellFormat(ws, aRow, 4, theme.TypeNumber, theme.FormatNumberDecimals)
      // c = setCell(ws, aRow, 0, `${stageResource.Resource.caption}`, theme.Normal)
      // c = setCell(ws, aRow, 1, `${stageResource.qnt}`, theme.Normal)
      // c = setCell(ws, aRow, 2, `${resourceStock.}`, theme.Normal)
      // c = setCell(ws, aRow, 3, `${resourceStock.Resource.}`, theme.Normal)
      // c = setCell(ws, aRow, 4, `${stageResource.price}`, theme.Normal)
      aRow += 1
      rts = 'R'
      if (ndx === stageResources.length-2) rts = 'LR'
    }
    aRow += 1
  }

  // set column width
  setColumnWidth(ws, 0, 35)
  setColumnWidth(ws, 1, 25)
  setColumnWidth(ws, 2, 12)

  // STEP 4: Write Excel file
  XLSX.utils.book_append_sheet(wb, ws, "Sheet")
  const fileName = path.join(process.env.REPORT_DIR, `product-resource-${product.id}.xlsx`)
  XLSX.writeFile(wb, fileName)

  return Promise.resolve(fileName)
}
