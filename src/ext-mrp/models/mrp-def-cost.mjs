import { v4 as uuid } from 'uuid'
import { makeMoment, printMoment } from '../../packages/utils/moment-utils.mjs'
import _ from 'lodash'

export const MrpDefCost = (app) => {
  const print = async (aItem, comments = '') => {
    if (process.env.NODE_ENV !== 'development') return

    // clone item:
    const item = _.clone(aItem)

    // expand item:
    const DefStage = app.exModular.models['MrpDefStage']
    item.DefStage = await DefStage.findById(item.defStageId)
    const Resource = app.exModular.models['MrpResource']
    item.Resource = await Resource.findById(item.resourceId)

    console.log(`MrpDefCost: ${comments}
    id: ${item.id}
    defStageId: ${item.defStageId}
    defStage.Caption: ${item.DefStage ? item.DefStage.caption : 'Not found'}
    resourceId: ${item.resourceId}
    resource.Caption: ${item.Resource ? item.Resource.caption : 'Not found'}
    amount: ${item.amount}
    amountBase: ${item.amountBase}
    partner: ${item.partner}
    comments: ${item.comments}`)
  }

  return {
    name: 'MrpDefCost',
    caption: 'Затраты',
    description: 'Описание затрат этапа получения ресурсов',
    seedFileName: 'mrp-def-cost.json',
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
        description: 'Ссылка на этап, для которого указаны затраты',
        default: null
      },
      {
        name: 'resourceId',
        type: 'ref',
        model: 'MrpResource',
        caption: 'Ресурс',
        description: 'Ссылка на ресурс, для которого указываются затраты (если дело касается списания ресурса)',
        default: null
      },
      {
        name: 'amount',
        type: 'decimal',
        caption: 'Сумма',
        description: 'Сумма расходов',
        precision: 16,
        scale: 4,
        format: '',
        default: 0
      },
      {
        name: 'amountBase',
        type: 'enum',
        caption: 'Тип суммы',
        description: 'Тип суммы - на какую базу ее относим: perPushQnt - на получаемое количество ' +
          'ресурса, perPullQnt - на затрачиваемые ресурсы для получения (сырье/материалы), perStage - затраты ' +
          'указаны абсолютной суммой и связаны с этапом в целом, не зависят от количества ресурсов',
        choices: ['perPushQnt', 'perPullQnt', 'perStage'],
        default: ['perPullQnt']
      },
      {
        name: 'partner',
        type: 'text',
        format: '',
        caption: 'Поставщик',
        description: 'Компания-поставщик',
        default: ''
      },
      {
        name: 'comments',
        type: 'text',
        format: '',
        caption: 'Примечания',
        description: 'Примечания, в свободной форме',
        default: ''
      }
    ]
  }
}
