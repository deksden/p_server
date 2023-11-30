import { v4 as uuid } from 'uuid'
import _ from 'lodash'
import moment from 'moment-business-days'

export const MrpVendor = (app) => {
  /**
   * Рассчитать дату начала заказа с учетом времени доставки и производства (выполнения заказа)
   * @param vendor    поставщик
   * @param date        дата завершения заказа
   * @return {moment}   дата начала заказа
   */
  const calculateOrderStartDate = (vendor, date) => {
    const supplyStart = moment(date)
    console.log(`Vendor.calculateOrderStartDate: vendor ${vendor.caption} date="${supplyStart.format('DD-MM-YYYY')}"`)
    // вычтем из конечной даты длительность заказа
    vendor.inWorkingDays
      ? supplyStart.businessSubtract(vendor.orderDuration)
      : supplyStart.subtract(vendor.orderDuration, 'days')
    // вычтем длительность доставки:
    vendor.deliveryInWorkingDays
      ? supplyStart.businessSubtract(vendor.deliveryDuration)
      : supplyStart.subtract(vendor.deliveryDuration, 'days')
    console.log(`Vendor.calculateOrderStartDate: end, supplyStart="${supplyStart.format('DD-MM-YYYY')}"`)
    return supplyStart
  }

  /**
   * Выбрать поставщика
   * @param resourceId  Ресурс
   * @param date        Дата поставки
   * @return (MrpVendor) выбранный поставщик
   */
  const selectVendor = async (resourceId, date) => {
    const Vendor = app.exModular.models['MrpVendor']
    const aDate = moment(date)

    // получить список поставщиков этого ресурса, сортированный по дате (от самых последних к более ранним)
    console.log(`MrpVendor.selectVendor: resource=${resourceId}, date=${aDate.format('DD-MM-YYYY')}`)

    const resVendors = await Vendor.findAll({
      where: { resource: resourceId },
      orderBy: [{ column: 'date', order: 'desc' }, { column: 'id', order: 'asc' }]
    })

    let selectedVendor = null

    if (resVendors.some((vendor) => {
      vendor.date = moment(vendor.date)

      console.log(`testing vendor: ${vendor.caption} (from ${vendor.date.format('DD-MM-YYYY')})`)
      // проверим этого вендора на пригодность по дате поставки:
      const supplyStart = calculateOrderStartDate(vendor, date)
      console.log(`calculated supplystart is ${supplyStart.format('DD-MM-YYYY')}`)
      // теперь в supplyStart находится самая ранняя дата доставки для этого вендора
      if (supplyStart.isSameOrAfter(vendor.date)) {
        console.log('vendor selected')
        selectedVendor = vendor
        return true
      }
      return false
    })) {
      return selectedVendor
    }
    return null
  }

  return {
    name: 'MrpVendor',
    seedFileName: 'mrp-vendor.json',
    selectVendor,
    calculateOrderStartDate,
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
        name: 'resource',
        type: 'ref',
        model: 'MrpResource',
        caption: 'Ресурс',
        description: 'Ссылка на ресурс',
        default: null
      },
      {
        name: 'caption',
        type: 'text',
        format: '',
        caption: 'Название',
        description: 'Наименование поставщика',
        default: ''
      },
      {
        name: 'address',
        type: 'text',
        format: '',
        caption: 'Адрес',
        description: 'Адрес поставщика',
        default: ''
      },
      {
        name: 'date',
        type: 'datetime',
        format: 'YYYY/MM/DD',
        caption: 'Дата',
        description: 'Дата начала работы с поставщиком',
        default: null
      },
      {
        name: 'invoicePrice',
        type: 'decimal',
        caption: 'Цена',
        description: 'Прайсовая цена поставляемого ресурса',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      },
      {
        name: 'invoiceCurrency',
        type: 'text',
        format: '',
        caption: 'Валюта',
        description: 'Валюта цены',
        default: ''
      },
      {
        name: 'orderDuration',
        type: 'decimal',
        caption: 'Длительность заказа',
        description: 'Длительность выполнения заказа от размещения заказа до отгрузки',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'inWorkingDays',
        type: 'boolean',
        format: '',
        caption: 'Рабочие дни',
        description: 'Длительность выполнения заказа указана в рабочих днях',
        default: false
      },
      {
        name: 'orderMin',
        type: 'decimal',
        caption: 'Минимальное количество',
        description: 'Минимальное количество ресурса в заказе',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
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
        name: 'orderStep',
        type: 'decimal',
        caption: 'Шаг количества',
        description: 'Шаг изменения количества заказываемого ресурса',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      },
      {
        name: 'deliveryCompany',
        type: 'text',
        format: '',
        caption: 'Доставка',
        description: 'Способ доставки партий заказываемого ресурса, например, транспортная компания',
        default: ''
      },
      {
        name: 'deliveryDuration',
        type: 'decimal',
        caption: 'Длительность доставки',
        description: 'Длительность доставки партии ресурса',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'deliveryInWorkingDays',
        type: 'boolean',
        format: '',
        caption: 'Доставка, рабочие дни',
        description: 'Длительность доставки заказа указана в рабочих днях',
        default: false
      }
    ]
  }
}
