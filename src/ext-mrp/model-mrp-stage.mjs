import { v4 as uuid } from 'uuid'

export const MrpStage = (app) => {
  return {
    name: 'MrpStage',
    seedFileName: 'mrp-stage.json',
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
        name: 'product',
        type: 'ref',
        model: 'MrpProduct',
        caption: 'Продукт',
        description: 'Ссылка на продукт',
        default: null
      },
      {
        name: 'order',
        type: 'decimal',
        caption: 'Порядок',
        description: 'Порядковый номер этапа производства',
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
        description: 'Наименование этапа производства',
        default: ''
      },
      {
        name: 'duration',
        type: 'decimal',
        caption: 'Длительность',
        description: 'Длительность в днях этапа производства',
        precision: 6,
        scale: 0,
        format: '',
        default: 1
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
