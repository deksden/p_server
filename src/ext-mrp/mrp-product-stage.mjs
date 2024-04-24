import { v4 as uuid } from 'uuid'

export const MrpProductStage = (app) => {
  return {
    name: 'MrpProductStage',
    caption: 'Запланированный этап',
    description: 'Запланированный производственный этап',
    seedFileName: 'mrp-product-stage.json',
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
        description: 'Дата завыершения этого этапа производства',
        format: 'DD-MM-YYYY'
      },
      {
        name: 'price',
        type: 'decimal',
        caption: 'Цена',
        description: 'Себестоимость ресурсов на одну единицу произведенной продукции нат этом этапе',
        precision: 16,
        scale: 4,
        format: '',
        default: 0
      },
    ]
  }
}
