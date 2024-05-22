import { v4 as uuid } from 'uuid'
import moment from 'moment-business-days'
import _ from 'lodash'
import { printMoment } from '../../packages/utils/moment-utils.mjs'

export const MrpStock = (app) => {
  /** Получить остатки ресурса на указанную дату - общее количество и перечень партий,
   * из которых состоит остаток;
   *
   * @param resourceId {id} идентификатор ресурса
   * @param date {datetime} дата, на которую считается остаток ресурса (включительно)
   * @return {Promise<Object>} промис разрешается в объект с полями qnt и batches
   */
  const qntForDate = async (resourceId, date) => {
    const Stock = app.exModular.models['MrpStock']
    const knex = Stock.storage.db
    const aDateFormat = Stock.props.date.format

    // получить общее количество ресурса на указанную дату на остатке:
    const qnt = await knex(Stock.name)
      .sum({ res:'qnt' })
      .where({ resource: resourceId })
      .where('date', '<=', moment.utc(date, aDateFormat).toDate())
      .then((res) => {
          return res[0].res
      })
      .catch((e) => { throw e })

    // теперь получим общее количество ресурса на остатке в разрезе партий:
    const batches = await knex(Stock.name)
      .select('batchId', 'date', 'resource', 'price', 'dateProd', 'dateExp', 'term')
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

  const print = async (aItem, comments = '') => {
    if(process.env.NODE_ENV !== 'development') return

    // clone item:
    const item = _.clone(aItem)

    // expand item:
    const Term = app.exModular.models['MrpTerm']
    item.Term = await Term.findById(item.term)
    const Resource2 = app.exModular.models['MrpResource2']
    item.resource2 = await Resource2.findById(item.resource)
    const ProductStage = app.exModular.models['MrpProductStage']
    item.ProductStage = await ProductStage.findById(item.productStage)
    const StageResource = app.exModular.models['MrpStageResource']
    item.StageResource = await StageResource.findById(item.stageResource)

    console.log(`Stock: ${comments}
      id: ${item.id}
      batchId: ${item.batchId}
      pullId: ${item.pullId}
      type: ${item.type}
      resourceId: ${item.resourceId}
      resource.Caption: ${item.resource2.caption}
      date: ${printMoment(item.date)}
      qnt: ${item.qnt}
      qntReq: ${item.qntReq}
      price: ${item.price}
      vendor: ${item.term}
      Term.caption: ${item.Term.caption}
      productStage: ${item.productStage}
      ProductStage.dateStart: ${printMoment(item.ProductStage.dateStart)}
      ProductStage.dateEnd: ${printMoment(item.ProductStage.dateStart)}
      ProductStage.price: ${item.ProductStage.price}
      stageResource: ${item.stageResource}
      StageResource.qnt: ${item.StageResource.qnt}
      StageResource.baseQnt: ${item.StageResource.baseQnt}
      StageResource.price: ${item.StageResource.price}
      dateOrder: ${printMoment(item.dateOrder)}
      dateProd: ${printMoment(item.dateProd)}
      dateExp: ${printMoment(item.dateExp)}
      `)
  }

  return {
    name: 'MrpStock',
    seedFileName: 'mrp-stock.json',
    caption: 'Учет ресурсов',
    description: 'Регистр для количественного учета ресурсов',
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
        name: 'batchId',
        type: 'text',
        caption: 'Партия',
        description: 'Партия ресурсов',
        format: 'uuid',
        default: ''
      },
      {
        name: 'pullId',
        type: 'text',
        caption: 'Pull-id',
        description: 'Идентификатор pull операции, с которой связана эта операция (группирует списания партий)',
        format: 'uuid',
        default: ''
      },
      {
        name: 'type',
        type: 'text',
        format: '',
        caption: 'Тип',
        description: 'Тип: ini - начальные, tr - в транзите/производстве, push, pull',
        default: ''
      },
      {
        name: 'resourceId',
        type: 'ref',
        model: 'MrpResource2',
        caption: 'Ресурс',
        description: 'Ссылка на ресурс, которого касается операция',
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
        name: 'qntReq',
        type: 'decimal',
        caption: 'Требуемое количество',
        description: 'Для операции заказа ресурса: сохраняем потребность в оригинальном требуемом количестве ресурса, которое может быть меньше объема заказа в ".qnt"',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'pushId',
        type: 'text',
        caption: 'Push-id',
        description: 'Идентификатор push операции, с которой связана эта операция (группирует операции поступления)',
        format: 'uuid',
        default: ''
      },
      {
        name: 'stageId',
        type: 'ref',
        model: 'MrpStage2',
        caption: 'Этап',
        description: 'Ссылка на этап, в рамках которого зарегистрирована операция (если push)',
        default: null
      },
      {
        name: 'stageRes',
        type: 'ref',
        model: 'MrpProductStage',
        caption: 'Этап производства',
        description: 'Ссылка на запланированный этап производства, к которому относится эта операция',
        default: null
      },
      {
        name: 'stageResource',
        type: 'ref',
        model: 'MrpStageResource',
        caption: 'Ресурсы этап',
        description: 'Ссылка на нормы расхода ресурса этапа производства, по которым был списан этот ресурс',
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
