import { v4 as uuid } from 'uuid'
import moment from 'moment'

/*
 Алгоритм:

 делаем обработчик - после сохранеения позиции плана вызываем модуль планирования для этой позиции.

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
    const Plan = app.exModular.models['MrpPlan']

    console.log(`${fnName}:`)
    if (res.err) {
      return next(new Error(`Error detected on ${fnName}!`))
    }

    // получаем сведения о продукте
    const plan = res.data
    console.log(`product = ${JSON.stringify(plan)}`)

    // на каждую дату вычисляем на эту дату остаток товара на складе и планы продаж
    const planQnt = await Plan.qntForDate(plan.product, plan.date)

    // основной алгоритм начинается здесь: обрабатываем строку сразу после ее сохранения в базу, но до отправки
    // результата на клиента (до обработчика sendData)
    console.log(`${fnName}: end`)
    next()
  }

  return {
    name: 'MrpPlan',
    caption: 'MRP Plan',
    description: 'План продаж',
//    seedFileName: 'mrp-plan.json',
    icon: 'BarChart',
    afterCreateBeg: [processPlan],
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
        format: 'DD-MM-YYYY',
        default: null
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
