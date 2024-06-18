import { v4 as uuid } from 'uuid'
import { makeMoment, printMoment } from '../../packages/utils/moment-utils.mjs'
import _ from 'lodash'

export const MrpDefStock = (app) => {
  const print = async (aItem, comments='') => {
    if(process.env.NODE_ENV !== 'development') return

    // clone item:
    const item = _.clone(aItem)

    // expand item:
    const Stage = app.exModular.models['MrpDefStage']
    item.Stage = await Stage.findById(item.stage)
    const Resource = app.exModular.models['MrpResource']
    item.Resource = await Resource.findById(item.resource)

    console.log(`MrpDefStock: ${comments}
      id: ${item.id}
      defStageId: ${item.defStageId}
      resourceId: ${item.resourceId}
      resource.Caption: ${item.Resource.caption}
      dateBeg: ${printMoment(item.dateBeg)}
      dateEnd: ${printMoment(item.dateEnd)}
      qnt: ${item.qnt}
      baseQnt: ${item.baseQnt}
      price: ${item.price}`)
  }

  return {
    name: 'MrpDefStock',
    caption: 'Нормы расхода',
    description: 'Описание норм расхода ресурсов на этапе',
    seedFileName: 'mrp-def-stock.json',
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
        name: 'defStageId',
        type: 'ref',
        model: 'MrpDefStage',
        caption: 'Этап',
        description: 'Ссылка на этап, для которого указана норма расхода',
        default: null
      },
      {
        name: 'resourceId',
        type: 'ref',
        model: 'MrpResource',
        caption: 'Ресурс',
        description: 'Ссылка на ресурс, для которого указана норма расхода на этапе',
        default: null
      },
      {
        name: 'dateBeg',
        type: 'datetime',
        caption: 'Дата начала',
        description: 'Дата начала действий этих норма расхода',
        format: 'DD-MM-YYYY'
      },
      {
        name: 'dateEnd',
        type: 'datetime',
        caption: 'Дата завершения',
        description: 'Дата завершения действий этих норма расхода',
        format: 'DD-MM-YYYY'
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
