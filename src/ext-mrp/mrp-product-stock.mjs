import { v4 as uuid } from 'uuid'

export const MrpProductStock = (app) => {
  return {
    name: 'MrpProductStock',
    seedFileName: 'mrp-product-stock.json',
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
        name: 'type',
        type: 'text',
        format: '',
        caption: 'Тип',
        description: 'Тип остаток - начальные, в процессе производства',
        default: ''
      },
      {
        name: 'date',
        type: 'datetime',
        caption: 'Дата',
        format: 'YYYY/MM/DD',
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
      },
      {
        name: 'price',
        type: 'decimal',
        caption: 'Цена',
        description: 'Себестоимость продукта',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      }
    ]
  }
}
