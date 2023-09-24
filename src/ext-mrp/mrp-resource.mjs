import { v4 as uuid } from 'uuid'

export const MrpResource = (app) => {
  return {
    name: 'MrpResource',
    seedFileName: 'mrp-resource.json',
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
        name: 'caption',
        type: 'text',
        format: '',
        caption: 'Название',
        description: 'Название продукта',
        default: ''
      },
      {
        name: 'unit',
        type: 'text',
        format: '',
        caption: 'Единица',
        description: 'Единица измерения количества',
        default: ''
      },
      {
        name: 'minStock',
        type: 'decimal',
        caption: 'Мин остаток',
        description: 'Минимальный складской остаток',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'minOrder',
        type: 'decimal',
        caption: 'Мин заказ',
        description: 'Минимальный заказ',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'orderPeriod',
        type: 'decimal',
        caption: 'Срок заказа',
        description: 'Длительность поставки',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'defPrice',
        type: 'decimal',
        caption: 'Цена',
        description: 'Цена ресурса по-умолчанию',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      },
      {
        name: 'initialDate',
        type: 'datetime',
        caption: 'Дата',
        description: 'Начальная дата появления ресурса',
        format: 'YYYY/MM/DD',
        default: null
      }
    ]
  }
}
