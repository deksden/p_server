import { v4 as uuid } from 'uuid'
import _ from 'lodash'
import { printMoment } from '../../packages/utils/moment-utils.mjs'
// import { makeMoment, printMoment } from '../../packages/utils/moment-utils.mjs'
// import moment from 'moment-business-days'

export const MrpDefProcessResource = (app) => {
const print = async (aItem, comments='') => {
    if (process.env.NODE_ENV !== 'development') return

    // clone item:
    const item = _.clone(aItem)

    // expand item:
    const Resource = app.exModular.models['MrpResource']
    item.Resource = await Resource.findById(item.resourceId)

    // print item:
    console.log(`MrpDefProcessResource: ${comments}
      id: ${item.id}
      resourceId: ${item.resourceId}
      Resource Caption: ${item.Resource ? item.Resource.caption : 'N/A'}
      qnt: ${item.qnt}
      orderMin: ${item.orderMin}
      orderStep: ${item.orderStep}
      comments: ${item.comments}`)
  }

  // Примечания к модели:
  // * модель - вспомогательная таблица к MrpDefProcess
  // * можно указать несколько ресурсов, которые будут получены в результате процесса
  // * количество qnt должно соответствовать шагу orderStep
  // * обычно указываем количество 1
  // * единица измерения указана в Resource.unit
  return {
    name: 'MrpDefProcessResource',
    caption: 'Ресурсы процесса',
    description: 'Описание ресурсов, которые будут получены в результате процесса',
    seedFileName: 'mrp-def-process-resource.json',
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
        name: 'resourceId',
        type: 'ref',
        model: 'MrpResource',
        caption: 'Ресурс',
        description: 'Ссылка на ресурс, который будет получен в результате процесса',
        expand: 'Resource',
        default: null
      },
      {
        name: 'qnt',
        type: 'decimal',
        caption: 'Количество',
        description: 'Количество ресурса, которое будет получено',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      },
      {
        name: 'orderMin',
        type: 'decimal',
        caption: 'Минимальное количество',
        description: 'Минимальное количество ресурса для заказа',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      },
      {
        name: 'orderStep',
        type: 'decimal',
        caption: 'Шаг количества',
        description: 'Шаг изменения количества заказываемого ресурса, кратно которому можно менять размер заказа',
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
        description: 'Примечания, в свободной форме',
        default: ''
      }
    ]
  }
}
