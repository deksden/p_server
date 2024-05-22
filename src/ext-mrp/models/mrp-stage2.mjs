import { v4 as uuid } from 'uuid'

export const MrpStage = (app) => {
  return {
    name: 'MrpStage',
    caption: 'Учет этапов',
    description: 'Регистр фактического учета прохождения этапов',
    seedFileName: 'mrp-stage2.json',
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
        description: 'Ссылка на ресурс',
        default: null
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
        name: 'dateStart',
        type: 'datetime',
        caption: 'Дата старта',
        description: 'Дата фактического старта этапа',
        format: 'DD-MM-YYYY'
      },
      {
        name: 'dateFinish',
        type: 'datetime',
        caption: 'Дата завершения',
        description: 'Дата фактического финиша этапа',
        format: 'DD-MM-YYYY'
      },
      {
        name: 'resourceStageId',
        type: 'ref',
        model: 'MrpResourceStage',
        caption: 'Этап',
        description: 'Ссылка на описание этого этапа',
        default: null
      },
      {
        name: 'qntPush',
        type: 'decimal',
        caption: 'Количество',
        description: 'Количество ресурса, которое будет получено в ходе прохождения этапов',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'totalCost',
        type: 'decimal',
        caption: 'Сумма',
        description: 'Общая сумма всех расходов этапа',
        precision: 16,
        scale: 4,
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
