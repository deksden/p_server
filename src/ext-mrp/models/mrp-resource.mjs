import { v4 as uuid } from 'uuid'
import moment from 'moment-business-days'
import { momentAddDays, printMoment } from '../../packages/utils/moment-utils.mjs'
import _ from 'lodash'

export const MrpResource = (app) => {

  /** Рассчитать объем заказа
   * @param orderMin {number} минимальный заказ, обычно из vendorTerm.orderMin
   * @param orderStep {number} шаг изменения партии, обычно из vendorTerm.orderStep
   * @param qnt {number} требуемое количество
   * @return {number} количество для заказа
   */
  const getOrderQnt = (orderMin, orderStep, qnt) => {
    let orderQnt = orderMin
    while (orderQnt < qnt) {
      orderQnt += orderStep
    }
    console.log(`Order qnt calculated: ${orderQnt}`)
    return orderQnt
  }

  /** Запланировать заказ ресурсов
   * @param resourceId  {string} id ресурса для заказа
   * @param date {date|datetime|moment}   дата когда ресурс должен поступить на склад
   * @param qnt {number}  количество ресурса, которое в указанную дату должно поступить. Количество ресурса в заказе может быть иным
   * @return (Promise:<MrpResourceStock>) промис, который разрешается в запись о сделанном заказе ресурса (дата
   * поступления будет целевая, а количество ресурса может быть увеличено в соответствии с требованиями поставщика
   * по минимальной партии к заказу и шагу увеличения партии)
  */
  const planOrderRes = async (resourceId, date, qnt) => {
    // подключим нужные API:
    const VendorTerm = app.exModular.models['MrpVendorTerm']
    const Resource = app.exModular.models['MrpResource']
    const ResourceStock = app.exModular.models['MrpResourceStock']

    const resource = await Resource.findById(resourceId)
    const aDate = moment(date)
    const aDateFormat = ResourceStock.props.date.format

    console.log(`MrpResource.planOrderRes(resource=${resourceId} "${resource.caption}", date="${aDate.format(aDateFormat)}", qnt=${qnt})`)

    // выбрать вендера для этой поставки:
    const vendorTerm = await VendorTerm.selectVendorTerm(resourceId, date)

    if (!vendorTerm) {
      throw new Error('VendorTerm not found')
    }

    // получим все партии продукта, которые заказывались у этого вендора, от последних до первых;
    // нам нужна только последняя партия на самом деле:
    const orders = await ResourceStock.findAll({
      where: { resource: resourceId, type: 'order'},
      whereOp: [ { column: 'date', op: '<=', value: printMoment(date) } ],
      orderBy: [{ column: 'date', order: 'desc' }]
    })

    console.log(`ResourceStock.orders:
      ${JSON.stringify(orders)}
      `)

    const startDate = VendorTerm.calculateOrderStartDate(vendorTerm, aDate)

    // смотрим последний заказ, вычисляем дату поступления на склад, сверяем с нашей потребностью;
    // если дата поступления отличается менее чем на 25% по сроку, то увеличим заказ:
    console.log('Анализируем последние заказы:')
    for (const order of orders) {
      console.log(`  order: ${JSON.stringify(order)}`)
      // посчитаем разницу в днях между датой поступления и датой заказа
      const orderDuration = moment(order.date).diff(moment(order.dateOrder), 'days')

      // если дата заказа попадает в дату прошлого заказа, или дата заказа меньше
      // чем через 1/3 длительности от даты прошлого заказа:
      if ((startDate.isBetween(order.dateOrder, order.date, undefined, '[]')) ||
          (startDate.isAfter(order.date) && (startDate.diff(order.date) <= orderDuration / 3))
      ) {
        // будем увеличивать прошлый заказ:
        console.log('  Не заказывать новую партию, а увеличить последнюю заказанную партию')
        order.qnt = getOrderQnt(vendorTerm.orderMin, vendorTerm.orderStep, qnt + order.qntReq)
        order.qntReq += qnt
        console.log(`  новое количество в заказе - ${order.qnt}`)
        return await ResourceStock.update(order.id, order)
      }
      console.log('  не подходит')
    }

    // заказываем новую партию:
    const orderQnt = getOrderQnt(vendorTerm.orderMin, vendorTerm.orderStep, qnt)

    console.log(` ResourceStock.create:
      ${startDate.format(aDateFormat)}
      qnt=${orderQnt}
      price=${vendorTerm.invoicePrice}`)

    // указать срок годности, для этого к дате начала заказа прибавить срок производства, и срок годности:
    let expDate = null
    if (vendorTerm.expDuration && vendorTerm.expDuration > 0) {
      // если для вендора указана длительность годности каждой партии сырья, то проставим срок годности:
      expDate= momentAddDays(startDate, vendorTerm.expDuration, vendorTerm.inWorkingDays)
    }

    // указать расчетную дату производства, для этого добавить к дате начала заказа срок производства:
    let prodDate = momentAddDays(startDate, vendorTerm.orderDuration, vendorTerm.inWorkingDays)

    // записать поступающий заказ в список партий: поступление заказа записываем целевой датой
    let aResStock = await ResourceStock.create({
      type: 'order',
      resource: resourceId,
      date: printMoment(aDate),
      dateOrder: printMoment(startDate),
      qnt: orderQnt,
      qntReq: qnt,
      price: vendorTerm.invoicePrice,
      vendorTerm: vendorTerm.id,
      dateExp: printMoment(expDate),
      dateProd: printMoment(prodDate)
    })
    aResStock = await ResourceStock.update(aResStock.id, { batchId: aResStock.id })
    return aResStock
  }

  const print = async (aItem, comments='') => {
    if(process.env.NODE_ENV !== 'development') return

    // clone item:
    const item = _.clone(aItem)

    console.log(`Resource: ${comments}
      id: ${item.id}
      caption: ${item.caption}
      unit: ${item.unit}
      minStock: ${item.minStock}
      expDuration: ${item.expDuration}`)
  }

  return {
    name: 'MrpResource',
    caption: 'Ресурсы',
    description: 'Ресурсы - это материалы и сырье, необходимые для производства продукции',
    seedFileName: 'mrp-resource.json',
    icon: 'BarChart',
    planOrderRes,
    print,
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
      },
      {
        name: 'expDuration',
        type: 'decimal',
        caption: 'Срок годности',
        description: 'Длительность срока годности продукта по-умолчанию',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      }
    ]
  }
}
