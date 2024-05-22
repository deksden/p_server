import { v4 as uuid } from 'uuid'
// import { makeMoment, printMoment } from '../../packages/utils/moment-utils.mjs'
// import moment from 'moment-business-days'

export const MrpResourceStage = (app) => {
  return {
    name: 'MrpStage2',
    caption: 'Этап',
    description: 'Описания этапов получения ресурса',
    seedFileName: 'mrp-resource-stage.json',
    icon: 'BarChart',
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
        model: 'MrpResource2',
        caption: 'Ресурс',
        description: 'Ссылка на ресурс, который будет получен в результате прохождения всех этапов',
        default: null
      },
      {
        name: 'dateBeg',
        type: 'datetime',
        caption: 'Дата начала',
        description: 'Дата начала действий этих условий этапа',
        format: 'DD-MM-YYYY'
      },
      {
        name: 'dateEnd',
        type: 'datetime',
        caption: 'Дата завершения',
        description: 'Дата завершения действий этих условий этапа',
        format: 'DD-MM-YYYY'
      },
      {
        name: 'order',
        type: 'decimal',
        caption: 'Порядок',
        description: 'Порядковый номер этапа',
        precision: 6,
        scale: 0,
        format: '',
        default: 1
      },
      {
        name: 'caption',
        type: 'text',
        format: '',
        caption: 'Название',
        description: 'Наименование этапа',
        default: ''
      },
      {
        name: 'duration',
        type: 'decimal',
        caption: 'Длительность',
        description: 'Длительность этого этапа',
        precision: 6,
        scale: 0,
        format: '',
        default: 1
      },
      {
        name: 'inWorkingDays',
        type: 'boolean',
        format: '',
        caption: 'Рабочие дни',
        description: 'Признак, что длительность этого этапа указана в рабочих днях',
        default: false
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
