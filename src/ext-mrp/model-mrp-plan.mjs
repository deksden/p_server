import { v4 as uuid } from 'uuid'

export const MrpPlan = (app) => {
  return {
    name: 'MrpPlan',
    caption: 'MRP Plan',
    seedFileName: 'mrp-plan.json',
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
        name: 'date',
        type: 'datetime',
        caption: 'Дата',
        format: 'YYYY/MM/DD',
        default: null
      },
      {
        name: 'product',
        type: 'ref',
        model: 'MrpProduct',
        caption: 'Продукт',
        description: 'Ссылка на продукт',
        default: null
      },
      {
        name: 'qnt',
        type: 'decimal',
        caption: 'Количество',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      }
    ]
  }
}
