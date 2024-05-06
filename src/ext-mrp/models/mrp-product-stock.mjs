import { v4 as uuid } from 'uuid'
import moment from 'moment/moment.js'
import _ from 'lodash'
import { printMoment } from '../../packages/utils/moment-utils.mjs'

export const MrpProductStock = (app) => {
  const qntForDate = async (productId, date) => {
    const ProductStock = app.exModular.models['MrpProductStock']
    const knex = ProductStock.storage.db
    const aDate1 = (moment.utc(date, 'DD-MM-YYYY').toDate()).getTime()
    const aDate2 = aDate1.toString()
    return knex(ProductStock.name)
      .sum({ res:'qnt' })
      .where({ product: productId })
      .where('date', '<=', aDate2)
      .then((res) => {
          return res[0].res
      })
      .catch((e) => { throw e })

  }

  const print = async (aItem, comments = '') => {
    if(process.env.NODE_ENV !== 'development') return

    // clone item:
    const item = _.clone(aItem)

    // expand item:
    const Product = app.exModular.models['MrpProduct']
    item.Product = await Product.findById(item.product)
    const Plan = app.exModular.models['MrpPlan']
    item.Plan = await Plan.findById(item.plan)

    console.log(`ProductStock: ${comments}
      id: ${item.id}
      product: ${item.product}
      Product.caption: ${item.Product.caption}
      plan:${item.plan}
      plan.date:${printMoment(item.Plan.date)}
      type: ${item.type}
      date: ${printMoment(item.date)}
      dateStart: ${printMoment(item.dateStart)}
      qnt: ${item.qnt}
      price: ${item.price}
      `)
  }

  return {
    name: 'MrpProductStock',
    caption: 'Остатки продукции',
    description: 'Сведения об остатках продукции, включают в себя остатки на складе, остатки в незавершенном производстве, поступления из производства (в результате планирования)',
    seedFileName: 'mrp-product-stock.json',
    icon: 'BarChart',
    qntForDate,
    print,
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
        name: 'product',
        type: 'ref',
        model: 'MrpProduct',
        caption: 'Продукт',
        description: 'Ссылка на продукт',
        default: null
      },
      {
        name: 'plan',
        type: 'ref',
        model: 'MrpPlan',
        caption: 'План',
        description: 'Ссылка на позицию плана с которой связана эта операция',
        default: null
      },
      {
        name: 'type',
        type: 'text',
        format: '',
        caption: 'Тип',
        description: 'Тип остатков: - начальные (initial), в процессе производства (in-production)',
        default: ''
      },
      {
        name: 'date',
        type: 'datetime',
        caption: 'Дата',
        description: 'Дата фиксации данных остатков, для остатков в незавернешшном производстве - дата завершения производства и передачи готовой продукции на склад',
        format: 'DD-MM-YYYY',
        default: null
      },
      {
        name: 'dateStart',
        type: 'datetime',
        caption: 'Дата нач',
        description: 'Дата старта производства, для записей о производстве',
        format: 'DD-MM-YYYY',
        default: null
      },
      {
        name: 'qnt',
        type: 'decimal',
        caption: 'Количество',
        description: 'Количество продукции',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'price',
        type: 'decimal',
        caption: 'Себестоимость',
        description: 'Материальная себестоимость продукции',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      }
    ]
  }
}
