import { v4 as uuid } from 'uuid'
import moment from 'moment'

/*
 Алгоритм:

 Делаем обработчик - после сохранения позиции плана вызываем модуль планирования для этой позиции.

 Лог планирования сохраняем в переменную status



* */

export const MrpPlan = (app) => {

  // получить остатки продукта на указанную дату
  const qntForDate = async (productId, date) => {
    const Plan = app.exModular.models['MrpPlan']
    const knex = Plan.storage.db
    const aDate1 = (moment.utc(date, 'DD-MM-YYYY').toDate()).getTime()
    const aDate2 = aDate1.toString()
    return knex('MrpPlan')
      .sum({ res:'qnt' })
      .where({ product: productId })
      .where('date', '<=', aDate2)
      .then((res) => {
          return res[0].res
      })
      .catch((e) => { throw e })

  }

  // Функция для обработки строки плана. Должна быть выполнена перед sendData (до отправки результатов клиенту),
  // возможно - до saveData:
  const processPlan = async (req, res, next) => {
    const fnName = 'MRP.processPlan'
    const Product = app.exModular.models['MrpProduct']
    const Plan = app.exModular.models['MrpPlan']
    const ProductStock = app.exModular.models['MrpProductStock']

    console.log(`${fnName}:`)
    if (res.err) {
      return next(new Error(`Error detected on ${fnName}!`))
    }

    // получаем сведения о продукте
    const plan = await Plan.findById(res.data.id)
    plan.date = moment(plan.date)
    // plan.date = moment(plan.date, Plan.props.date.format)
    console.log(`plan = ${JSON.stringify(plan)}`)

    const product = await Product.findById(plan.product)
    console.log(`product = ${JSON.stringify(product)}`)

    // на каждую дату вычисляем на эту дату остаток товара на складе и планы продаж
    const planQnt = await Plan.qntForDate(plan.product, plan.date.format('DD-MM-YYYY'))
    const stockQnt = await ProductStock.qntForDate(plan.product, plan.date.format('DD-MM-YYYY'))

    // смотрим текущее сальдо между продажами и производством
    const currentQnt = stockQnt - planQnt
    console.log(`\nproduct "${product.caption}", ${plan.date}: stock ${stockQnt}, plan ${planQnt} = ${currentQnt}`)

    product.qntMin = 50000
    if (currentQnt <= product.qntMin) {
      // если текущее сальдо меньше минимального остатка на складе, нужно планировать партию продукции:
      console.log(`Need production: minQnt ${product.qntMin}`)

      // const plannedProd = Product.planProduction(product.id, plan.date, Math.abs(currentQnt))
      const prodDuration = await Product.prodDuration(product.id)
      // console.log(`Production qnt: ${plannedProd.qntForProd}, ${prodDuration}${product.inWorkingDays ? 'wd' : 'd'}`)
    }

    console.log(`${fnName}: end`)
  }
  const Wrap = app.exModular.services.wrap

  return {
    name: 'MrpPlan',
    caption: 'MRP Plan',
    description: 'План продаж',
//    seedFileName: 'mrp-plan.json',
    icon: 'BarChart',
    afterCreateBeg: [Wrap(processPlan)],
    props: [
      {
        name: 'id',
        type: 'id',
        caption: 'Id',
        description: 'Идентификатор',
        format: 'uuid',
        default: () => uuid()
      },
      {
        name: 'date',
        type: 'datetime',
        caption: 'Дата',
        format: 'DD-MM-YYYY'
      },
      {
        name: 'product',
        type: 'ref',
        model: 'MrpProduct',
        caption: 'Продукт',
        description: 'Ссылка на продукт',
        default: null
      },
      {
        name: 'qnt',
        type: 'decimal',
        caption: 'Количество',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'status',
        type: 'text',
        caption: 'Статус',
        description: 'Статус планирования производства этой позиции плана продаж',
        format: '',
        default: ''
      }
    ],
    qntForDate
  }
}
