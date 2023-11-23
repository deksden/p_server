import { v4 as uuid } from 'uuid'
import moment from 'moment-business-days'

export const MrpResourceStock = (app) => {
  const qntForDate = async (resourceId, date) => {
    const ResourceStock = app.exModular.models['MrpResourceStock']
    const knex = ResourceStock.storage.db
    const aDate1 = (moment.utc(date, 'DD-MM-YYYY').toDate()).getTime()
    const aDate2 = aDate1.toString()
    return knex(ResourceStock.name)
      .sum({ res:'qnt' })
      .where({ resource: resourceId })
      .where('date', '<=', aDate2)
      .then((res) => {
          return res[0].res
      })
      .catch((e) => { throw e })
  }

  return {
    name: 'MrpResourceStock',
    seedFileName: 'mrp-resource-stock.json',
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
        format: 'YYYY/MM/DD',
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
        name: 'comments',
        type: 'text',
        format: '',
        caption: 'Примечания',
        description: 'Примечания',
        default: ''
      }
    ]
  }
}
