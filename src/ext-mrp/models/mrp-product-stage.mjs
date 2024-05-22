import { v4 as uuid } from 'uuid'
import { printMoment } from '../../packages/utils/moment-utils.mjs'
import _ from 'lodash'

export const MrpProductStage = (app) => {
  const print = async (aItem, comments='') => {
    if(process.env.NODE_ENV !== 'development') return

    // clone item:
    const item = _.clone(aItem)

    // expand:
    const Plan = app.exModular.models['MrpPlan']
    item.Plan = await Plan.findById(item.plan)
    const Stage = app.exModular.models['MrpStage']
    item.Stage = await Stage.findById(item.stage)

    // print:
    console.log(`ProductStage: ${comments}
      id:${item.id}
      plan:${item.plan}
      plan.date:${printMoment(item.Plan.date)}
      plan.qnt:${item.Plan.qnt}
      stage:${item.stage}
      stage.Caption: ${item.Stage.caption}
      dateStart:${printMoment(item.dateStart)}
      dateEnd:${printMoment(item.dateEnd)}
      totalQntForProd:${item.totalQntForProd}
      price:${item.price}`)
  }

  return {
    name: 'MrpProductStage',
    caption: 'Запланированный этап',
    description: 'Запланированный производственный этап',
    seedFileName: 'mrp-product-stage.json',
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
        name: 'plan',
        type: 'ref',
        model: 'MrpPlan',
        caption: 'План',
        description: 'Ссылка на план, в соответствии с которым запланировано производство',
        default: null
      },
      {
        name: 'stage',
        type: 'ref',
        model: 'MrpStage',
        caption: 'Этап',
        description: 'Ссылка на описание этого этапа производства',
        default: null
      },
      {
        name: 'dateStart',
        type: 'datetime',
        caption: 'Дата начала',
        description: 'Дата начала этого этапа производства',
        format: 'DD-MM-YYYY'
      },
      {
        name: 'dateEnd',
        type: 'datetime',
        caption: 'Дата завершения',
        description: 'Дата завершения этого этапа производства',
        format: 'DD-MM-YYYY'
      },
      {
        name: 'totalQntForProd',
        type: 'decimal',
        caption: 'Количество в партии',
        description: 'Количество продукции (общее), которое планируется произвести в партии',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'price',
        type: 'decimal',
        caption: 'Цена',
        description: 'Себестоимость ресурсов на одну единицу произведенной продукции на этом этапе',
        precision: 16,
        scale: 4,
        format: '',
        default: 0
      },
    ]
  }
}
