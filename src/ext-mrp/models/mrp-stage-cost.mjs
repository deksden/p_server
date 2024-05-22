import { v4 as uuid } from 'uuid'
import { makeMoment, printMoment } from '../../packages/utils/moment-utils.mjs'
import _ from 'lodash'

export const MrpStageCost = (app) => {
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
    name: 'MrpStageCost',
    caption: 'Затраты',
    description: 'Описание затрат этапа получения ресурсов',
    seedFileName: 'mrp-stage-cost.json',
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
        description: 'Ссылка на этап, для которого указаны затраты',
        default: null
      },
      {
        name: 'stageResourceId',
        type: 'ref',
        model: 'MrpResource2',
        caption: 'Ресурс',
        description: 'Ссылка на ресурс, для которого указываются затраты',
        default: null
      },
      {
        name: 'perPullQnt',
        type: 'decimal',
        caption: 'Сумма на рес',
        description: 'Сумма расходов на единицу затраченных ресурсов, этапе .stageId, ресурс .resourceId',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      }
    ]
  }
}
