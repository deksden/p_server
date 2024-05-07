import { v4 as uuid } from 'uuid'
import _ from 'lodash'
import moment from 'moment-business-days'
import { makeMoment, momentSubtractDays, printMoment } from '../../packages/utils/moment-utils.mjs'

export const MrpTerm = (app) => {
  /**
   * Рассчитать дату начала заказа с учетом времени доставки и времени выполнения заказа поставщиком
   * @param term    поставщик
   * @param date        дата завершения заказа
   * @return {moment}   дата начала заказа
   */
  const calculateOrderStartDate = (term, date) => {
    // вычтем из конечной даты длительность заказа
    let supplyStart = momentSubtractDays(date, term.orderDuration, term.inWorkingDays)

    // вычтем длительность доставки:
    supplyStart = momentSubtractDays(supplyStart, term.deliveryDuration, term.deliveryInWorkingDays)

    console.log(`fn Term.calculateOrderStartDate:
      term: ${term.caption}
      date="${printMoment(date)}
      supplyStart: "${printMoment(supplyStart)}"
    `)

    return supplyStart
  }

  /**
   * Выбрать поставщика, который может поставить ресурс на указанную дату
   * @param resourceId  {string} (-> MrpResource.id) код ресурса
   * @param date        {string|moment} Дата, к которой должна быть выполнена поставка (в формате строки или
   * moment-like), то есть дата завершения заказа
   * @param tSelector {string} селектор для выбора условий поставки:
   *   * "minPrice": выбрать условия с минимальной ценой
   *   * "minDuration": выбрать условия с минимальным сроком поставки (максимальной датой начала поставки)
   *   * "$-cmd": (ещё не реализовано) директивы по выбору условий
   * @return {Object} структура данных формата:
   *   * term: выбранные условия поставки
   *   * terms: полный список условий, которые по дате подходят для поставки
   */
  const selectTerm = async (resourceId, date,
    tSelector = 'minPrice') =>
  {
    const Term = app.exModular.models['MrpTerm']
    const aDate = makeMoment(date)
    const ret = {
      term: null,
      terms: []
    }

    if (!['minPrice','minDuration'].includes(tSelector)) {
      throw new Error(`tSelector value ("${tSelector}") is invalid.`)
    }

    // получить список поставщиков этого ресурса, сортированный по
    // дате (от самых последних к более ранним)
    console.log(`fn Term.selectVendor:
      resource=${resourceId}
      date=${printMoment(aDate)}
    `)

    // получим все условия поставки для этого ресурса в хронологическом порядке:
    // уберем только заведомо ненужные условия с датой начала действия условий больше даты поставки
    const aTerms = await Term.findAll({
      where: { resource: resourceId },
      whereOp: [{ column: 'date', op: '<=', value: printMoment(date) }],
      orderBy: [{ column: 'date', order: 'desc' }, { column: 'id', order: 'asc' }]
    })

    for (const [ndx, aTerm] of aTerms.entries()) {
      aTerm.date = moment(aTerm.date)

      // проверим этого вендора на пригодность по дате поставки:
      // вычислим дату начала заказа для этих условий:
      aTerm._dateStart = calculateOrderStartDate(aTerm, date)

      // укажем что не подходит
      aTerm._status = false

      // проверим что дата начала заказа попадает в период действия этих условий:
      if (
        (aTerm.dateEnd === null && aTerm._dateStart.isSameOrAfter(aTerm.date)) ||
        (aTerm._dateStart.isBetween(aTerm.date, aTerm.dateEnd, 'days', '[]'))
      ) {
        // укажем что подходит по дате:
        aTerm._status = true
      }

      console.log(`#${ndx} vendor:
        _status: ${aTerm._status}
        _dateStart: ${printMoment(aTerm._dateStart)}
        id: ${aTerm.id}
        caption: "${aTerm.caption}"
        date: ${printMoment(aTerm.date)}
        dateEnd: ${printMoment(aTerm.dateEnd)}
        price: ${aTerm.price}
      `)

      // добавим отобранные условия в массив:
      if (aTerm._status) ret.terms.push(aTerm)
    }

    // если вообще ничего нет - вернем пустую запись
    if (ret.terms.length === 0) {
      console.log('No terms! exiting with null')
      return ret
    }
    if (ret.terms.length === 1) {
      // если только одна запись - то ее и вернем:
      ret.term = ret.terms[0]
      console.log(`single term: ${JSON.stringify(ret.term)}`)
    } else if (tSelector === 'minPrice') {
      ret.term = _.minBy(ret.terms, 'price')
      console.log(`select minPrice, term: ${JSON.stringify(ret.term)}`)
    } else if (tSelector === 'minDuration') {
      ret.term = _.maxBy(ret.terms, '_dateStart')
      console.log(`select minDuration, term: ${JSON.stringify(ret.term)}`)
    }

    return ret
  }

  return {
    name: 'MrpTerm',
    caption: 'Условия поставки',
    description: 'Сведения об условиях поставки от поставщика',
    seedFileName: 'mrp-term.json',
    icon: 'BarChart',
    selectTerm,
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
        name: 'price',
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
