import { v4 as uuid } from 'uuid'
import moment from 'moment'
import { makeMoment } from '../../packages/utils/moment-utils.mjs'

export const MrpPlan = (app) => {

  // получить остатки продукта на указанную дату
  const qntForDate = async (productId, date) => {
    const Plan = app.exModular.models['MrpPlan']
    const knex = Plan.storage.db
    return knex('MrpPlan')
      .sum({ res:'qnt' })
      .where({ product: productId })
      .where('date', '<=', makeMoment(date).toDate() )
      .then((res) => {
          return res[0].res
      })
      .catch((e) => { throw e })

  }

  // Функция для обработки строки плана. Должна быть выполнена перед sendData (до отправки результатов клиенту),
  // возможно - до saveData:
  const afterSavePlan = async (req, res, next) => {
    const fnName = 'MRP.afterSavePlan'

    console.log(`${fnName}:`)
    if (res.err) {
      return next(new Error(`Error detected on ${fnName}!`))
    }
    const ret = await processPlan(res.data.id)
  }

  /** Обработать указанных план из таблицы MRpPlan
   *
   * @param planId {number} идентификатор плана в таблице
   * @return {Promise<Awaited<{planId: string, prodDuration: number, plannedProd: number}>>} возвращаем информацию о проведенном планировании
   */
  const processPlan = async (planId) => {
    const fnName = 'MRP.processPlan'
    const Product = app.exModular.models['MrpProduct']
    const Plan = app.exModular.models['MrpPlan']
    const ProductStock = app.exModular.models['MrpProductStock']

    if (!planId) {
      throw new Error(`${fnName}: invalid planId argument`)
    }

    console.log(`${fnName}:`)

    // получаем сведения о продукте
    const plan = await Plan.findById(planId)
    plan.date = makeMoment(plan.date, Plan.props.date.format)
    console.log(`plan = ${JSON.stringify(plan)}`)

    const product = await Product.findById(plan.product)
    console.log(`product = ${JSON.stringify(product)}`)

    // на каждую дату вычисляем на эту дату остаток товара на складе и планы продаж
    const planQnt = await Plan.qntForDate(plan.product, plan.date.format('DD-MM-YYYY'))
    const stockQnt = await ProductStock.qntForDate(plan.product, plan.date.format('DD-MM-YYYY'))

    // смотрим текущее сальдо между продажами и производством
    const currentQnt = stockQnt - planQnt
    console.log(`\nproduct "${product.caption}", ${plan.date}: stock ${stockQnt}, plan ${planQnt} = ${currentQnt}`)

    let plannedProd = 0
    let prodDuration = 0
    // product.qntMin = 50000
    if (currentQnt <= product.qntMin) {
      // если текущее сальдо меньше минимального остатка на складе, нужно планировать партию продукции:
      console.log(`Need production: minQnt ${product.qntMin}`)

      const ctx = { plan }

      // console.log(`ctx = ${JSON.stringify(ctx)}`)

      plannedProd = await Product.planProduction(product.id, plan.date, Math.abs(currentQnt), ctx)
      prodDuration = await Product.prodDuration(product.id)
      console.log(`Plan prod: qnt: ${plannedProd.qntForProd}, duration=${prodDuration}${product.inWorkingDays ? 'wd' : 'd'}`)
    }

    console.log(`${fnName}: end`)

    return Promise.resolve({ planId, plannedProd, prodDuration })
  }

  /** Обработать все имеющиеся в табличке MrpPlan записи о планах производства
   *
   * @param version {string} версия данных, если '' то используем основную версию
   * @param clearData {boolean} нужно ли очищать данные (как правило - да)
   * @return {Promise<{items: Object}>} возвращает массив данных об обработанных планах
   */
  const processAllPlans = async (version = '', clearData=true) => {
    const Plan = app.exModular.models['MrpPlan']
    const ret = []

    // очистить данные
    if (clearData) {
      app.exModular.services.seed.variantFolder = version
      await app.exModular.storages.Clear('MRP')
    }

    // обработать все планы
    const plans = await Plan.findAll({ orderBy: ['date', 'product'] })
    for( const plan of plans ) {
      ret.push(await Plan.processPlan(plan.id)) // добавим сведения о выполненном планировании
    }

    // вернем массив сведений о выполненных планированиях
    return ({ items: ret })
  }

  const Wrap = app.exModular.services.wrap

  return {
    name: 'MrpPlan',
    caption: 'План',
    description: 'План продаж',
    seedFileName: 'mrp-plan.json',
    icon: 'BarChart',
    qntForDate,
    processPlan,
    processAllPlans,
    // afterCreateBeg: [Wrap(afterSavePlan)],
    props: [
      {
        name: 'id',
        type: 'id',
        caption: 'Код',
        description: 'Идентификатор записи',
        format: 'uuid',
        default: () => uuid()
      },
      {
        name: 'date',
        type: 'datetime',
        caption: 'Дата',
        description: 'Дата, на которую планируется выдать на склад указанное количество продукции',
        format: 'DD-MM-YYYY'
      },
      {
        name: 'resourceId',
        type: 'ref',
        model: 'MrpResource',
        caption: 'Продукт',
        description: 'Продукция, производство которой планируется',
        defOptions: {
          wide: 'wide'
        },
        default: null
      },
      {
        name: 'qnt',
        type: 'decimal',
        caption: 'Количество',
        description: 'Количество продукции, которое планируется получить на склад в указанную дату',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'status',
        type: 'text',
        caption: 'Статус',
        description: 'Статус планирования производства этой позиции плана продаж',
        format: '',
        default: ''
      },
      {
        name: 'tSelector',
        type: 'text',
        caption: 'Выбор условий',
        description: 'Критерий выбора условий: minPrice, minDuration, minTotal или $-директивы',
        format: '',
        size: 512,
        default: 'minPrice'
      }
    ]
  }
}
