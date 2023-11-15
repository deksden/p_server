import { v4 as uuid } from 'uuid'

/*
 Алгоритм:

 делаем обработчик - после сохранеения позиции плана вызываем модуль планирования для этой позиции.

 Лог планирования сохраняем в переменную status



* */

export const MrpPlan = (app) => {

  // функция для обработки строки плана. Должна быть выполнена перед sendData (до отправки результатов клиенту),
  // возможно - до saveData:
  const processPlan = (req, res, next) => {
    const fnName = 'MRP.processPlan'

    console.log(`${fnName}:`)
    if (res.err) {
      return next(new Error(`Error detected on ${fnName}!`))
    }

    const product = res.data
    console.log(`product = ${JSON.stringify(product)}`)

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
        format: 'YYYY/MM/DD',
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
    ]
  }
}
