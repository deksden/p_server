import { v4 as uuid } from 'uuid'
import { makeMoment, printMoment } from '../../packages/utils/moment-utils.mjs'
import _ from 'lodash'

export const MrpStageStock = (app) => {
  const print = async (aItem, comments='') => {
    if(process.env.NODE_ENV !== 'development') return

    // clone item:
    const item = _.clone(aItem)

    // expand item:
    const Stage = app.exModular.models['MrpStage']
    item.Stage = await Stage.findById(item.stage)
    const Resource = app.exModular.models['MrpResource']
    item.Resource = await Resource.findById(item.resource)

    console.log(`MrpStageStock: ${comments}
      id: ${item.id}
      stage: ${item.stage}
      stage.Caption: ${item.Stage.caption}
      resource: ${item.resource}
      resource.Caption: ${item.Resource.caption}
      date: ${printMoment(item.date)}
      qnt: ${item.qnt}
      baseQnt: ${item.baseQnt}
      price: ${item.price}`)
  }

  return {
    name: 'MrpStageStock',
    caption: 'Нормы расхода',
    description: 'Описание норм расхода ресурсов на этапе',
    seedFileName: 'mrp-stage-stock.json',
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
        name: 'stageId',
        type: 'ref',
        model: 'MrpStage2',
        caption: 'Этап',
        description: 'Ссылка на этап, для которого указана норма расхода',
        default: null
      },
      {
        name: 'resourceId',
        type: 'ref',
        model: 'MrpResource2',
        caption: 'Ресурс',
        description: 'Ссылка на ресурс, для которого указана норма расхода на этапе',
        default: null
      },
      {
        name: 'date',
        type: 'datetime',
        caption: 'Дата',
        description: 'Дата с которой действует эта норма',
        format: 'DD-MM-YYYY',
        default: makeMoment('01-01-1900')
      },

      {
        name: 'qnt',
        type: 'decimal',
        caption: 'Количество',
        description: 'Количество потребляемого ресурса на этом этапе, в отношении к resource.baseQnt',
        precision: 16,
        scale: 4,
        format: '',
        default: 0
      },
      {
        name: 'baseQnt',
        type: 'decimal',
        caption: 'База',
        description: 'Базовое количество продукции в штуках, относительно которого установлены нормы расхода (например, "на 100 штук")',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'price',
        type: 'decimal',
        caption: 'Цена',
        description: 'Плановая стоимость единицы ресурса',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      }
    ]
  }
}
