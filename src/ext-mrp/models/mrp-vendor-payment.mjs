import { v4 as uuid } from 'uuid'

export const MrpVendorPayment = (app) => {
  return {
    name: 'MrpVendorPayment',
    caption: 'Схема оплаты',
    description: 'Схема оплаты поставщику для формирования календарного графика платежей',
    seedFileName: 'mrp-vendor-payment.json',
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
        name: 'vendorTerm',
        type: 'ref',
        model: 'MrpVendorTerm',
        caption: 'Условия поставки',
        description: 'Ссылка на условия поставщика',
        default: null
      },
      {
        name: 'type',
        type: 'text',
        format: '',
        caption: 'Тип',
        description: 'Тип затрат - оплата товара (invoice), доставки (delivery)',
        default: ''
      },
      {
        name: 'term',
        type: 'text',
        format: '',
        caption: 'Условие',
        description: 'Как указана величина платежа: фиксированная сумма (fixed) или в процентах от суммы счёта (percent)',
        default: ''
      },
      {
        name: 'value',
        type: 'decimal',
        caption: 'Значение',
        description: 'Величина оплаты, указана в соответствии с условиями',
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
        description: 'Валюта, в котором номинирован платёж',
        default: ''
      },
      {
        name: 'base',
        type: 'text',
        format: '',
        caption: 'База',
        description: 'База, относительно которой указан платёж - от суммы заказа',
        default: ''
      },
      {
        name: 'time',
        type: 'decimal',
        caption: 'Период',
        description: 'Период в днях от даты заказа, когда необходимо сделать платеж',
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
