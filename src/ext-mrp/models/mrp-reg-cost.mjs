import { v4 as uuid } from 'uuid'
import moment from 'moment-business-days'
import _ from 'lodash'
import { printMoment } from '../../packages/utils/moment-utils.mjs'

export const MrpRegCost = (app) => {
  const print = async (aItem, comments = '') => {
    if(process.env.NODE_ENV !== 'development') return

    // clone item:
    const item = _.clone(aItem)

    // expand item:
    const Term = app.exModular.models['MrpTerm']
    item.Term = await Term.findById(item.term)
    const Resource = app.exModular.models['MrpResource']
    item.Resource = await Resource.findById(item.resource)
    const ProductStage = app.exModular.models['MrpProductStage']
    item.ProductStage = await ProductStage.findById(item.productStage)
    const StageResource = app.exModular.models['MrpStageResource']
    item.StageResource = await StageResource.findById(item.stageResource)

    console.log(`MrpRegCost: ${comments}
      id: ${item.id}
      batchId: ${item.batchId}
      type: ${item.type}
      resource: ${item.resource}
      resource.Caption: ${item.Resource.caption}
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
    name: 'MrpRegCost',
    seedFileName: 'mrp-reg-cost.json',
    caption: 'Учет расходов',
    description: 'Регистр учета расходов',
    icon: 'BarChart',
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
        name: 'pushId',
        type: 'text',
        caption: 'Push-id',
        description: 'Идентификатор push операции, с которой связана эта операция (группирует операции поступления)',
        format: 'uuid',
        default: ''
      },
      {
        name: 'type',
        type: 'text',
        format: '',
        caption: 'Тип',
        description: 'Тип: ini - начальные, tr - в транзите/производстве',
        default: ''
      },
      {
        name: 'regStockId',
        type: 'ref',
        model: 'MrpRegStock',
        caption: 'Учет ресурсов',
        description: 'Ссылка на операцию с ресурсом, к которой относятся эти расходы',
        default: null
      },
      {
        name: 'regStageId',
        type: 'ref',
        model: 'MrpRegStage',
        caption: 'Этап',
        description: 'Ссылка на этап, в рамках которого зарегистрирована операция',
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
        name: 'summ',
        type: 'decimal',
        caption: 'Цена',
        description: 'Стоимость единицы ресурса',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
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
