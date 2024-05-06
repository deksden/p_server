import { v4 as uuid } from 'uuid'
import { printMoment } from '../../packages/utils/moment-utils.mjs'
import _ from 'lodash'

export const MrpStageResource = (app) => {
  const print = async (aItem, comments='') => {
    if(process.env.NODE_ENV !== 'development') return

    // clone item:
    const item = _.clone(aItem)

    // expand item:
    const Stage = app.exModular.models['MrpStage']
    item.Stage = await Stage.findById(item.stage)
    const Resource = app.exModular.models['MrpResource']
    item.Resource = await Resource.findById(item.resource)

    console.log(`StageResource: ${comments}
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
    name: 'MrpStageResource',
    caption: 'Нормы расхода',
    description: 'Нормы расхода ресурсов на этапе производства',
    seedFileName: 'mrp-stage-resource.json',
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
        name: 'stage',
        type: 'ref',
        model: 'MrpStage',
        caption: 'Этап',
        description: 'Ссылка на этап производства, для которого уазана норма расхода',
        default: null
      },
      {
        name: 'resource',
        type: 'ref',
        model: 'MrpResource',
        caption: 'Ресурс',
        description: 'Ссылка на ресурс, для которого указана норма расхода на этапе производства',
        default: null
      },
      {
        name: 'date',
        type: 'datetime',
        caption: 'Дата',
        description: 'Дата с которой действует эта норма',
        format: 'DD-MM-YYYY',
        default: '01-01-1900'
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
