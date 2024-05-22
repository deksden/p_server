import { v4 as uuid } from 'uuid'
import moment from 'moment-business-days'
import { makeMoment, momentAddDays, momentSubtractDays, printMoment } from '../../packages/utils/moment-utils.mjs'
import _ from 'lodash'

export const MrpResource2 = (app) => {

  /** Сделать расчет начальной даты проведения этапов, если окончание этапов должно случиться
   * в указанную дату
   * @param stageId {string} идентификатор первого этапа с условиями
   * @param date {string|moment} дата, к которой нужно было сделать поставку
   * @return {moment} начальная дата
   */
  const startDate = async (stageId, date) => {
    const Stage2 = app.exModular.models['MrpStage2']
    let aDate = makeMoment(date) // начальное значение - финиш этапов

    // получим указанный этап
    const stage = await Stage2.findById(stageId)

    // если это - первый этап, получим все остальные этапы:
    const aStages = await Stage2.findAll({
      where: { resourceId: stage.resourceId, dateStart: printMoment(stage.dateStart) },
      orderBy: [{ column: 'order', order: 'asc' }]
    })

    // обработаем список этапов:
    for (let aStage of aStages) {
      // будем вычитать длительность текущего этапа из aDate
      aDate = momentSubtractDays(aDate, aStage.duration, aStage.inWorkingDays)
    }
    return aDate
  }

  /**
   * Выбрать условия поставки на указанную дату среди этапов
   * @param resourceId  {string} (-> MrpResource.id) код ресурса
   * @param date        {string|moment} Дата, к которой должна быть выполнена поставка (в формате строки или
   * moment-like), то есть дата завершения заказа
   * @param tSelector {string} селектор для выбора условий поставки:
   *   * "minPrice": выбрать условия с минимальной ценой
   *   * "minDuration": выбрать условия с минимальным сроком поставки (максимальной датой начала поставки)
   *   * "$-cmd": (ещё не реализовано) директивы по выбору условий
   * @return {Object} структура данных формата:
   *   * term: {<MrpResourceStage>} объект, выбранные условия
   *   * terms: [<MrpResourceStage>] массив объектов, полный список условий, которые по дате подходят для поставки
   */
  const select = async (resourceId, date, tSelector = 'minPrice') => {
    const Stage2 = app.exModular.models['MrpStage2']
    const aDate = makeMoment(date)
    const ret = {
      term: null,
      terms: []
    }

    if (!['minPrice', 'minDuration'].includes(tSelector)) {
      throw new Error(`tSelector value ("${tSelector}") is invalid.`)
    }

    // получить список возможных условий, сортированный по
    // дате (от самых последних к более ранним)
    console.log(`fn .select:
      resourceId=${resourceId}
      date=${printMoment(aDate)}
    `)

    // получим все условия поставки для этого ресурса в хронологическом порядке:
    // уберем только заведомо ненужные условия с датой начала действия условий больше даты поставки
    const aStages = await Stage2.findAll({
      where: { resourceId: resourceId },
      whereOp: [
        { column: 'dateStart', op: '<=', value: printMoment(date) },
        { column: 'order', op: '=', value: 0 },
      ],
      orderBy: [{ column: 'dateStart', order: 'desc' }, { column: 'id', order: 'asc' }]
    })

    for (const [ndx, aStage] of aStages.entries()) {
      aStage.dateStart = moment(aStage.dateStart)

      // проверим на пригодность по дате поставки:
      // вычислим дату начала заказа для этих условий:
      aStage._dateStart = startDate(aStage, date)

      // укажем что не подходит
      aStage._status = false

      // проверим что дата начала заказа попадает в период действия этих условий:
      if (
        (aStage.dateEnd === null && aStage._dateStart.isSameOrAfter(aStage.date)) ||
        (aStage._dateStart.isBetween(aStage.date, aStage.dateEnd, 'days', '[]'))
      ) {
        // укажем что подходит по дате:
        aStage._status = true
      }

      console.log(`#${ndx} vendor:
        _status: ${aStage._status}
        _dateStart: ${printMoment(aStage._dateStart)}
        id: ${aStage.id}
        caption: "${aStage.caption}"
        date: ${printMoment(aStage.date)}
        dateEnd: ${printMoment(aStage.dateEnd)}
        price: ${aStage.price}
      `)

      // добавим отобранные условия в массив:
      if (aStage._status) ret.terms.push(aStage)
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

  /** Рассчитать объем заказа
   * @param orderMin {number} минимальный заказ, обычно из term.orderMin
   * @param orderStep {number} шаг изменения партии, обычно из term.orderStep
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

  /** Списать ресурсы (партионно), при необходимости сделать заказ недостающих ресурсов
   *
   * @param resourceId {string} ресурс
   * @param aDate {string | moment} дата, которой будем списывать ресурсы
   * @param qnt {number} количество ресурса, которое требуется списать; заказано может быть больше ресурса;
   * @return {Promise<string>} возвращаем pull_id, соответствующий этому списанию ресурса
   */
  const fnPull  = async (resourceId, aDate, qnt) => {
    const Stock = app.exModular.models['MrpStock']
    const date = makeMoment(aDate)

    console.log(`fnPull( resourceId=${resourceId}, date=${printMoment(date)}, qnt=${qnt} date=${date}`)
    let pullId = uuid()
    console.log(`  new pull_id = ${pullId}`)

    // Алгортим:
    // получим остатки ресурса и список партий:
    let qntForDate = await Stock.qntForDate(resourceId, date)
    console.log(`Stock.qntForDate:
      qnt ${qntForDate.qnt}
      batches: ${JSON.stringify(qntForDate.batches)}`)

    // списать имеющиеся остатки партионно в указанную дату:
    let restQnt = qnt // остаток ресурсов для списания
    let ndx = 0 // текущий индекс в списке партий ресурсов
    console.log(`Start while restQnt (${restQnt})`)
    while ((restQnt > 0) && (ndx < qntForDate.batches.length)) {
      // берем текущую партию
      const aBatch = qntForDate.batches[ndx]
      console.log(`* processing batch[${ndx}]:
          qnt: ${aBatch.qnt}
          batchId: ${aBatch.batchId}
          term: ${aBatch.term}`)
      if (aBatch.qnt >= restQnt) {
        // если текущей партии сырья хватает, чтобы покрыть остаток списываемых ресурсов, то:
        aBatch.qnt = aBatch.qnt - restQnt // скорректируем размер партии ресурсов

        const aStock = { // зафиксируем списание ресурсов из этой партии
          type: '', // 'prod', // (?) почему сразу prod? возможно сначала будет 'plan-product'
          resource: resourceId,
          date: printMoment(date), // startDate.format(aDateFormat),
          qnt: -restQnt,
          comments: ``,
          batchId: aBatch.batchId,
          pullId,
          dateProd: aBatch.dateProd ? printMoment(aBatch.dateProd) : null,
          dateExp: aBatch.dateExp ? printMoment(aBatch.dateExp) : null,
          price: aBatch.price,
          term: aBatch.term,
          // добавить pullId - по нему будем собирать все pull, которые связаны
          // следующие поля актуальны только для производства. Нужно подумать над общими условиями:
          productStage: null, // productStage.id, какой этап продукта обрабатывааем
          stageResource: null // stageResource.id по какой норме списываем ресурс
        }

        // зафиксируем сумму потребленных ресурсов:
        // stageResSumm += (aBatch.price * restQnt)
        // вот тут можно записать в MrpCost суммы (!)

        Stock.print(aStock,'(v1 - big batch):')

        // запишем в базу:
        await Stock.create(aStock)
        restQnt = 0 // полностью списали ресурс, цикл закончился
      } else {
        // если текущей партии ресурсов не хватает на текущее количество ресурсов к списанию,
        // то списать в размере остатка ресурсов из этой партии:
        const aResStock = { // зафиксируем списание ресурсов из этой партии
          type: '', // 'prod',
          resource: resourceId,
          date: printMoment(date), // startDate.format(aDateFormat),
          qnt: -aBatch.qnt,
          comments: ``, // `stage: ${stage.order} ${stage.caption}`,
          batchId: aBatch.batchId,
          pullId,
          dateProd: aBatch.dateProd ? printMoment(aBatch.dateProd) : null,
          dateExp: aBatch.dateExp ? printMoment(aBatch.dateExp) : null,
          price: aBatch.price,
          term: aBatch.term,
          productStage: null, // productStage.id,
          stageResource: null // stageResource.id
        }

        // зафиксируем стоимость потребленных ресурсов
        // stageResSumm += (aBatch.price * aBatch.qnt)
        Stock.print(aResStock,'(v2 - batch is small):')

        await Stock.create(aResStock)

        restQnt -= aBatch.qnt // уменьшим количество ресурсов к списанию на размер текущей партии
        aBatch.qnt = 0 // зафиксируем, что эта партия списана

        ndx += 1 // переходим к следующей партии
      }
    }

    // после цикла списаний смотрим что у нас с остатком ресурса:
    if ( restQnt === 0 ) {
      // если всё количество списали из имеющихся партий
      console.log('All respurces pulled! exiting ... ')
      return Promise.resolve(pullId)
    }

    // Вот тут начинаем логику, что осталось количество к списанию, которого нет
    // на остатках. Значит необходимо увеличить количество в остатках.
    console.log(`Resource restQnt=${restQnt}`)

    // заказать новую партию через fnPush и запомнить ее идентификатор:
    const push_id = await fnPush(resourceId, date, restQnt)

    // проверить, что остаток соответствует:
    qntForDate = await Stock.qntForDate(resourceId, date)

    if (qntForDate.qnt < restQnt) {
      // Ошибка: ресурсов по какой-то причине недостаточно для списания!
      throw Error(`fnPush result invalid. Not enough resource for restQnt!`)
    }

    // найдем партию в остатках по идентификатору:
    const aBatch = _.find(qntForDate.batches, { batchId: push_id })
    if (!aBatch) {
      throw Error(`batch "${push_id}" not found in qntForDate.batches!`)
    }

    // спишем требуемый остаток из партии:
    const aStock = { // зафиксируем списание ресурсов из этой партии
      type: '', // 'prod',
      resource: resourceId,
      date: printMoment(date), // startDate.format(aDateFormat),
      qnt: -restQnt,
      comments: ``,
      batchId: aBatch.batchId,
      pullId,
      dateProd: aBatch.dateProd ? printMoment(aBatch.dateProd) : null,
      dateExp: aBatch.dateExp ? printMoment(aBatch.dateExp) : null,
      price: aBatch.price,
      term: aBatch.term,
      productStage: null, // productStage.id,
      stageResource: null // stageResource.id
    }

    // сохраним в базу
    await Stock.create(aStock)

    // возвращаем pullId:
    return Promise.resolve(pullId)
  }

  /** Очистить вся регистры от push операции по push-Id
   *
   * @param pushId {string} идентификатор push операции
   * @return {Promise<void>}
   */
  const clearPush = async (pushId) => {
    const Stage2 = app.exModular.models['MrpStage2']
    const Stock = app.exModular.models['MrpStock']
    const Cost = app.exModular.models['MrpCost']

    // получить все pull операции для этого push-id:
    // нужно убрать все операции из регистра Stage2
    // Потом выбираем все операции из регистров Stock и Cost, и удаляем их.
    await Stock.removeAll({ where: { pushId }})
    await Cost.removeAll({ where: { pushId }})
    await Stage2.removeAll({ where: { pushId }})
    return Promise.resolve()
  }

  /** Запланировать поступление ресурса на склад - заказ или увеличение последней партии
   *
   * @param resourceId {string} идентификатор ресурса
   * @param date {string|moment} дата, к которой на остатках должно быть требуемое количество ресурса
   * @param qnt {number} требуемое количество ресурса; заказ ресурса может быть больше, если условия отгрузки
   * предполагают минимальную поставку и шаг изменения партии
   * @param tSelector {'minPrice'|'minDuration'} селектор для выбора условий
   * @return {Promise<string>} возвращает push_id - идентификатор поступившей партии
   */
  const fnPush = async (resourceId, date, qnt, tSelector = 'minPrice') => {
    const Resource2 = app.exModular.models['MrpResource2']
    const Stock = app.exModular.models['MrpStock']
    const Stage2 = app.exModular.models['MrpStage2']

    const resource2 = await Resource2.findById(resourceId)
    const aDate = moment(date)
    const aDateFormat = Stock.props.date.format

    //
    console.log(`tSelector: ${tSelector}`)

    if (!['minPrice','minDuration'].includes(tSelector)) {
      throw new Error(`tSelector value ("${tSelector}") is invalid.`)
    }

    console.log(`Stage2.select(resource=${resourceId} "${resource2.caption}", date="${printMoment(aDate)}", qnt=${qnt})`)

    // получить условия для этого поступления ресурса:
    const ret = await select(resourceId, date, tSelector)

    if (!ret || !ret.term) {
      throw new Error('Term not found')
    }

    const term = ret.term

    // получим все партии ресурса, которые заказывались, от последних до первых;
    // нам нужна только последняя партия на самом деле:
    const stocks = await Stock.findAll({
      where: { resourceId: resourceId, type: 'push'},
      whereOp: [ { column: 'date', op: '<=', value: printMoment(date) } ],
      orderBy: [{ column: 'date', order: 'desc' }]
    })

    console.log(`ResourceStock.orders:
      ${JSON.stringify(stocks)}
      `)

    // дата старта заказа (старта первого этапа)
    const aStartDate = startDate(term, aDate)

    // смотрим последний заказ, вычисляем дату поступления на склад, сверяем с нашей потребностью;
    // если дата поступления отличается менее чем на 25% по сроку, то увеличим заказ:
    console.log('Анализируем последние заказы:')
    let aPushOp
    for (aPushOp of stocks) {
      console.log(`  order: ${JSON.stringify(aPushOp)}`)
      // посчитаем разницу в днях между датой поступления и датой заказа
      const orderDuration = moment(aPushOp.date).diff(moment(aPushOp.dateOrder), 'days')

      // если дата заказа попадает в дату прошлого заказа, или дата заказа меньше
      // чем через 1/3 длительности от даты прошлого заказа:
      if ((aStartDate.isBetween(aPushOp.dateOrder, aPushOp.date, undefined, '[]')) ||
          (aStartDate.isAfter(aPushOp.date) && (aStartDate.diff(aPushOp.date) <= orderDuration / 3))
      ) {
        // будем увеличивать прошлый заказ:
        console.log('  Не заказывать новую партию, а увеличить последнюю заказанную партию')
        aPushOp.qnt = getOrderQnt(term.orderMin, term.orderStep, qnt + aPushOp.qntReq)
        aPushOp.qntReq += qnt
        console.log(`  новое количество в заказе - ${aPushOp.qnt}`)

        // очистим все связанные операции
        await clearPush(aPushOp.pushId)
      }
      console.log('Оформляем новый заказ:')

      // получим описание всех этапов:
    }
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
    name: 'MrpResource2',
    caption: 'Ресурсы',
    description: 'Ресурсы - это материалы и сырье, необходимые для производства продукции',
    seedFileName: 'mrp-resource.json',
    icon: 'BarChart',
    fnPush,
    fnPull,
    print,
    select,
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
        description: 'Длительность срока годности продукта по-умолчанию, если не указан в Term',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      }
    ]
  }
}
