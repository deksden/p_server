import { v4 as uuid } from 'uuid'
import _ from 'lodash'
import moment from 'moment-business-days'
import { momentSubtractDays, printMoment } from '../../packages/utils/moment-utils.mjs'

export const MrpVendorTerm = (app) => {
  /**
   * Рассчитать дату начала заказа с учетом времени доставки и времени выполнения заказа поставщиком
   * @param vendorTerm    поставщик
   * @param date        дата завершения заказа
   * @return {moment}   дата начала заказа
   */
  const calculateOrderStartDate = (vendorTerm, date) => {
    // вычтем из конечной даты длительность заказа
    let supplyStart = momentSubtractDays(date, vendorTerm.orderDuration, vendorTerm.inWorkingDays)

    // вычтем длительность доставки:
    supplyStart = momentSubtractDays(supplyStart, vendorTerm.deliveryDuration, vendorTerm.deliveryInWorkingDays)

    console.log(`fn VendorTerm.calculateOrderStartDate:
      vendorTerm: ${vendorTerm.caption}
      date="${printMoment(date)}
      supplyStart: "${printMoment(supplyStart)}"
    `)

    return supplyStart
  }

  /**
   * Выбрать поставщика, который может поставить ресурс на указанную дату
   * @param resourceId  Ресурс
   * @param date        Дата поставки
   * @return (MrpVendorTerm) выбранный поставщик
   */
  const selectVendorTerm = async (resourceId, date) => {
    const VendorTerm = app.exModular.models['MrpVendorTerm']
    const aDate = moment(date)

    // получить список поставщиков этого ресурса, сортированный по дате (от самых последних к более ранним)
    console.log(`fn VendorTerm.selectVendor:
      resource=${resourceId}
      date=${printMoment(aDate)}
    `)

    const aVendorTerms = await VendorTerm.findAll({
      where: { resource: resourceId },
      orderBy: [{ column: 'date', order: 'desc' }, { column: 'id', order: 'asc' }]
    })

    let selectedVendorTerm = null

    if (aVendorTerms.some((aVendorTerm) => {
      aVendorTerm.date = moment(aVendorTerm.date)

      console.log(`  Testing vendor: ${aVendorTerm.id} - "${aVendorTerm.caption}" (from ${printMoment(aVendorTerm.date)})`)

      // проверим этого вендора на пригодность по дате поставки:
      const supplyStart = calculateOrderStartDate(aVendorTerm, date)

      // теперь в supplyStart находится самая ранняя дата доставки для этого вендора
      if (supplyStart.isSameOrAfter(aVendorTerm.date)) {
        console.log(`  This vendor "${aVendorTerm.caption}" was selected.`)
        selectedVendorTerm = aVendorTerm
        return true
      }

      console.log('VendorTerm not selected.')
      return false
    })) {
      return selectedVendorTerm
    }
    return null
  }

  return {
    name: 'MrpVendorTerm',
    caption: 'Условия поставки',
    description: 'Сведения об условиях поставки от поставщика',
    seedFileName: 'mrp-vendor-term.json',
    icon: 'BarChart',
    selectVendorTerm: selectVendorTerm,
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
        description: 'Ссылка на поставляемый ресурс',
        defOptions: {
          wide: "wide"
        },
        default: null
      },
      {
        name: 'caption',
        type: 'text',
        format: '',
        caption: 'Название',
        description: 'Наименование условий поставки',
        defOptions: {
          wide: "fullWide"
        },
        default: ''
      },
      {
        name: 'address',
        type: 'text',
        format: '',
        caption: 'Адрес',
        description: 'Адрес поставщика, для документов',
        defOptions: {
          wide: "fullWide"
        },
        default: ''
      },
      {
        name: 'date',
        type: 'datetime',
        format: 'DD-MM-YYYY',
        caption: 'Дата нач',
        description: 'Дата, с которой эти условия начинают работать, включительно',
        default: null
      },
      {
        name: 'dateEnd',
        type: 'datetime',
        format: 'DD-MM-YYYY',
        caption: 'Дата ок',
        description: 'Дата окончания работы условий - дата до которой условия действовали, включительно',
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
        description: 'Валюта, в которой номинирована цена',
        default: ''
      },
      {
        name: 'orderDuration',
        type: 'decimal',
        caption: 'Длительность заказа',
        description: 'Длительность выполнения заказа от даты размещения заказа до даты отгрузки (передачи в транспортную компанию)',
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
        description: 'Признак, что длительность выполнения заказа указана в рабочих днях',
        default: false
      },
      {
        name: 'orderMin',
        type: 'decimal',
        caption: 'Минимальное количество',
        description: 'Минимальное количество ресурса для заказа',
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
        description: 'Единица измерения количества ресурса',
        default: ''
      },
      {
        name: 'orderStep',
        type: 'decimal',
        caption: 'Шаг количества',
        description: 'Шаг изменения количества заказываемого ресурса, кратно которому можно менять размер заказа',
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
        description: 'Способ доставки партий заказываемого ресурса, например, транспортная компания (или ее название)',
        defOptions: {
          wide: "wide"
        },
        default: ''
      },
      {
        name: 'deliveryDuration',
        type: 'decimal',
        caption: 'Длительность доставки',
        description: 'Длительность доставки партии ресурса от даты передачи в доставку до даты поступления на склад заказчика, в днях',
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
        description: 'Признак, что длительность доставки заказа указана в рабочих днях',
        default: false
      },
      {
        name: 'expDuration',
        type: 'decimal',
        caption: 'Длительность годности',
        description: 'Длительность годности ресурса от даты производства, в днях, с учетом .inWorkingDays',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
    ]
  }
}
