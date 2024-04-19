import { v4 as uuid } from 'uuid'
import moment from 'moment-business-days'
import _ from 'lodash'

export const MrpResourceStock = (app) => {
  /** Получить остатки ресурса на указанную дату - общее количество и перечень партий,
   * из которых состоит остаток;
   *
   * @param resourceId {id} идентификатор ресурса
   * @param date {datetime} дата, на которую считается остаток ресурса (включительно)
   * @return {Promise<Object>} промис разрешается в объект с полями qnt и batches
   */
  const qntForDate = async (resourceId, date) => {
    const ResourceStock = app.exModular.models['MrpResourceStock']
    const knex = ResourceStock.storage.db
    const aDateFormat = ResourceStock.props.date.format

    // получить общее количество ресурса на указанную дату на остатке:
    const qnt = await knex(ResourceStock.name)
      .sum({ res:'qnt' })
      .where({ resource: resourceId })
      .where('date', '<=', moment.utc(date, aDateFormat).toDate())
      .then((res) => {
          return res[0].res
      })
      .catch((e) => { throw e })

    // теперь получим общее количество ресурса на остатке в разрезе партий:
    const batches = await knex(ResourceStock.name)
      .select('batchId', 'date', 'resource', 'price', 'dateProd', 'dateExp', 'vendor')
      .sum({ qnt: 'qnt' })
      .groupBy('batchId')
      .orderBy([
        { column: 'dateExp', order: 'asc'},
        { column: 'date', order: 'asc'},
        { column: 'id', order: 'asc'}
      ])
      .where({ resource: resourceId })
      .where('date', '<=', moment.utc(date, aDateFormat).toDate())
      .catch((e) => { throw e })

    return {
      qnt,
      batches: _.filter(batches, (itm) => (itm.qnt > 0))
    }
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
        description: 'Дата учетной операции на складе - поступление или списание, остатки ресурса на складе меняются в эту дату',
        format: 'DD-MM-YYYY',
        default: null
      },
      {
        name: 'qnt',
        type: 'decimal',
        caption: 'Количество',
        description: 'Количество ресурса в операции, для поступления число больше нуля, для расхода ресурса - меньше нуля',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'price',
        type: 'decimal',
        caption: 'Цена',
        description: 'Стоимость единицы ресурса',
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
        description: 'Ссылка на поставщика ресурса, для расходных операций указывается поставщик той партии, которая списыввается этой операцией',
        default: null
      },
      {
        name: 'dateOrder',
        type: 'datetime',
        caption: 'Дата заказа',
        description: 'Дата размещения заказа поставщику',
        format: 'DD-MM-YYYY',
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
