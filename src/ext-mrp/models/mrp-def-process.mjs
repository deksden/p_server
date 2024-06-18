import { v4 as uuid } from 'uuid'
import _ from 'lodash'
import { printMoment } from '../../packages/utils/moment-utils.mjs'
// import { makeMoment, printMoment } from '../../packages/utils/moment-utils.mjs'
// import moment from 'moment-business-days'

export const MrpDefProcess = (app) => {
  const print = async (aItem, comments='') => {
    if(process.env.NODE_ENV !== 'development') return

    // clone item:
    const item = _.clone(aItem)

    // expand item:
    const Resource = app.exModular.models['MrpResource']
    item.Resource = await Resource.findById(item.resource)

    // print item:
    console.log(`MrpDefProcess: ${comments}
      id: ${item.id}
      resourceId: ${item.resourceId}
      resource.Caption: ${item.Resource.caption}
      dateBeg: ${printMoment(item.dateBeg)}
      dateEnd: ${printMoment(item.dateEnd)}
      order: ${item.order}
      caption: ${item.caption}
      duration: ${item.duration}
      inWorkingDays: ${item.inWorkingDays}
      orderMin: ${item.orderMin}
      orderStep: ${item.orderStep}
      comments: ${item.comments}`)
  }

  return {
    name: 'MrpDefProcess',
    caption: 'Этап',
    description: 'Описания процесса получения ресурса',
    seedFileName: 'mrp-def-process.json',
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
        description: 'Ссылка на ресурс, который будет получен в результате прохождения всех этапов',
        default: null
      },
      {
        name: 'dateBeg',
        type: 'datetime',
        caption: 'Дата начала',
        description: 'Дата начала действия этого процесса',
        format: 'DD-MM-YYYY'
      },
      {
        name: 'dateEnd',
        type: 'datetime',
        caption: 'Дата завершения',
        description: 'Дата завершения действий этого процесса',
        format: 'DD-MM-YYYY'
      },
      {
        name: 'caption',
        type: 'text',
        format: '',
        caption: 'Название',
        description: 'Наименование процесса',
        default: ''
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
