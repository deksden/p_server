import { v4 as uuid } from 'uuid'
import moment from 'moment/moment.js'

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

  return {
    name: 'MrpProductStock',
    seedFileName: 'mrp-product-stock.json',
    qntForDate,
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
        name: 'type',
        type: 'text',
        format: '',
        caption: 'Тип',
        description: 'Тип остаток - начальные, в процессе производства',
        default: ''
      },
      {
        name: 'date',
        type: 'datetime',
        caption: 'Дата',
        format: 'DD-MM-YYYY',
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
        name: 'price',
        type: 'decimal',
        caption: 'Цена',
        description: 'Себестоимость продукта',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      }
    ]
  }
}
