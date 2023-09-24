import { v4 as uuid } from 'uuid'

export const MrpVendorPayment = (app) => {
  return {
    name: 'MrpVendorPayment',
    seedFileName: 'mrp-vendor-payment.json',
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
        name: 'vendor',
        type: 'ref',
        model: 'MrpVendor',
        caption: 'Поставщик',
        description: 'Ссылка на поставщика',
        default: null
      },
      {
        name: 'type',
        type: 'text',
        format: '',
        caption: 'Тип',
        description: 'Тип затрат - оплата товара, доставки',
        default: ''
      },
      {
        name: 'term',
        type: 'text',
        format: '',
        caption: 'Условие',
        description: 'Вид условия оплаты - в процентах, фиксированная сумма',
        default: ''
      },
      {
        name: 'value',
        type: 'decimal',
        caption: 'Значение',
        description: 'Величина платежа, зависит от условия - процент, сумма',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      },
      {
        name: 'currency',
        type: 'text',
        format: '',
        caption: 'Валюта',
        description: 'Валюта, в котором номинировано значения',
        default: ''
      },
      {
        name: 'base',
        type: 'text',
        format: '',
        caption: 'База',
        description: 'База, относительно которой указано значение - от суммы заказа',
        default: ''
      },
      {
        name: 'time',
        type: 'decimal',
        caption: 'Период',
        description: 'Период в днях когда необходимо сделать платеж',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'caption',
        type: 'text',
        format: '',
        caption: 'Описание',
        description: 'Описание этого платежа в свободной форме',
        default: ''
      }
    ]
  }
}
