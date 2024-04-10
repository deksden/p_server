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

    const resource = await Resource.findById(resourceId)
    const aDate = moment(date)
    const aDateFormat = ResourceStock.props.date.format
    console.log(`MrpResource.planOrderRes(resource=${resourceId} "${resource.caption}", date="${aDate.format(aDateFormat)}", qnt=${qnt})`)

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
    console.log(`.end, ResourceStock.create: ${startDate.format(aDateFormat)} qnt=${orderQnt} price=${vendor.invoicePrice}`)

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
    caption: 'Ресурсы',
    description: 'Ресурсы - это материалы и сырье, необходимые для производства продукции',
    seedFileName: 'mrp-resource.json',
    icon: 'BarChart',
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
        description: 'Название ресурса',
        default: ''
      },
      {
        name: 'unit',
        type: 'text',
        format: '',
        caption: 'Единица',
        description: 'Учётная единица измерения количества ресурса в системе, в которой учитываем его количество',
        default: ''
      },
      {
        name: 'minStock',
        type: 'decimal',
        caption: 'Мин остаток',
        description: 'Минимальный складской остаток ресурса, который должен остаться на складе',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      }
      /*
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
        format: 'DD-MM-YYYY',
        default: null
      } */
    ]
  }
}
