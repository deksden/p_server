import { v4 as uuid } from 'uuid'
import moment from 'moment-business-days'

export const MrpResourceStock = (app) => {
  /** Получить остатки ресурса на указанную дату
   *
   * @param resourceId {}
   * @param date
   * @return {Promise<Number>}
   */
  const qntForDate = async (resourceId, date) => {
    const ResourceStock = app.exModular.models['MrpResourceStock']
    const knex = ResourceStock.storage.db
    const aDate1 = (moment.utc(date, 'DD-MM-YYYY').toDate())
    const aDate2 = aDate1.toString()

    // получить общее количество ресурса на указанную дату на остатке:
    const aQnt = await knex(ResourceStock.name)
      .sum({ res:'qnt' })
      .where({ resource: resourceId })
      .where('date', '<=', aDate2)
      .then((res) => {
          return res[0].res
      })
      .catch((e) => { throw e })

    // теперь получим общее количество ресурса на остатке в разрезе партий:
    const batches = await knex(ResourceStock.name)
      .select('batchId', 'resource', 'price', 'dateProd', 'dateExp', 'vendor')
      .sum({ res:'qnt' })
      .groupBy('batchId', 'resource', 'price', 'dateProd', 'dateExp', 'vendor')
      .where({ resource: resourceId })
      .where('date', '<=', aDate2)
      .catch((e) => { throw e })

    console.log('== batches:')
    console.log(JSON.stringify(batches))
    return aQnt
  }

  return {
    name: 'MrpResourceStock',
    seedFileName: 'mrp-resource-stock.json',
    caption: 'Остатки ресурсов',
    icon: 'BarChart',
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
        name: 'batchId',
        type: 'text',
        caption: 'Партия',
        description: 'Партия ресурсов',
        format: 'uuid',
        default: ''
      },
      {
        name: 'type',
        type: 'text',
        format: '',
        caption: 'Тип',
        description: 'Тип остаток - начальные, в транспортировке',
        default: ''
      },
      {
        name: 'resource',
        type: 'ref',
        model: 'MrpResource',
        caption: 'Ресурс',
        description: 'Ссылка на ресурс',
        default: null
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
        description: 'Себестоимость ресурса',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      },
      {
        name: 'vendor',
        type: 'ref',
        model: 'MrpVendor',
        caption: 'Поставщик',
        description: 'Ссылка на поставщика',
        default: null
      },
      {
        name: 'dateProd',
        type: 'datetime',
        caption: 'Дата производства',
        description: 'Дата производства этой партии ресурса',
        format: 'DD-MM-YYYY',
        default: null
      },
      {
        name: 'dateExp',
        type: 'datetime',
        caption: 'Дата годности',
        description: 'Срок годности этой партии ресурса',
        format: 'DD-MM-YYYY',
        default: null
      },
      {
        name: 'comments',
        type: 'text',
        format: '',
        caption: 'Примечания',
        description: 'Примечания',
        default: ''
      }
    ],
    beforeSave: (aItem) => {
      if (aItem.qnt >= 0 && (aItem.batchId === undefined || aItem.batchId === null || aItem.batchId === '')) {
        aItem.batchId = aItem.id
      }
      return aItem
    }
  }
}
