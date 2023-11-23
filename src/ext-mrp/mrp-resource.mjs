import { v4 as uuid } from 'uuid'
import moment from 'moment-business-days'

export const MrpResource = (app) => {

  /** Запланировать заказ ресурсов
   * @param resourceId  ресурс для заказа
   * @param date        дата когда он должен поступить на склад
   * @param qnt         количество ресурсов, которое в указанную дату должно быть на складе
   * @return (Promise:<MrpResourceStock>) промис, который разрешается в запись о заказанной партии (записана в базу)
  */
  const planOrderRes = async (resourceId, date, qnt) => {
    // подключим нужные API:
    const Vendor = app.exModular.models['MrpVendor']
    const Resource = app.exModular.models['MrpResource']
    const ResourceStock = app.exModular.models['MrpResourceStock']

    const resource = Resource.findById(resourceId)
    const aDate = moment(date)
    console.log(`Planning order: res ${resource.caption} ${aDate.format('DD-MM-YYYY')} qnt=${qnt}`)

    // выбрать вендера для этой поставки:
    const vendor = await Vendor.selectVendor(resourceId, date)

    if (!vendor) {
      throw new Error('Vendor not found')
    }
    console.log(`Vendor selected: ${vendor.caption}`)

    // рассчитаем количество ресурса для заказа:
    let orderQnt = vendor.orderMin
    while (orderQnt < qnt) {
      orderQnt += vendor.orderStep
    }
    console.log(`Order qnt calculated: ${orderQnt}`)

    const startDate = Vendor.calculateOrderStartDate(vendor, aDate)
    console.log(`Ordered: ${startDate.format(defDateFormat)} qnt=${orderQnt} price=${vendor.invoicePrice}`)

    // записать заказ ресурса в список партий:
    return await ResourceStock.create({
      type: 'order',
      resource: resourceId,
      date: startDate,
      qnt: orderQnt,
      price: vendor.invoicePrice
    })
  }

  return {
    name: 'MrpResource',
    seedFileName: 'mrp-resource.json',
    planOrderRes,
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
