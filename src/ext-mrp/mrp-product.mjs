import { v4 as uuid } from 'uuid'
import _ from 'lodash'
import moment from 'moment-business-days'

export const MrpProduct = (app) => {
  /** Рассчитать длительность производства
   * @param productId : идентификатор продукта для которого считаем длительность производства
   * @returns {number} : длительность производства в днях (ссумируем длительность этапов)
   */
  const prodDuration = async (productId) => {
    const Product = app.exModular.models['MrpProduct']
    const knex = Product.storage.db
    return knex('MrpStage')
      .sum({ res:'duration' })
      .where({ product: productId })
      .then((res) => {
          return res[0].res
      })
      .catch((e) => { throw e })

  }

  const planProduction = async (productId, date, qnt) => {
    // получаем API всех нужных объектов в системе
    const Product = app.exModular.models['MrpProduct']
    const Plan = app.exModular.models['MrpPlan']
    const Stock = app.exModular.models['MrpProductStock']
    const Stage = app.exModular.models['MrpStage']
    const StageResource = app.exModular.models['MrpStageResource']
    const Resource = app.exModular.models['MrpResource']
    const ResourceStock = app.exModular.models['MrpResourceStock']

    // загружаем сведения о продукции:
    const product = await Product.findById(productId)

    const ret = {}

    // из свойств модели получаем формат даты, с которым работаем:
    const aDateFormat = Plan.props.date.format

    // переводим формат переменной даты в объект moment
    if (typeof date === 'string') {
      date = moment.utc(date, aDateFormat)
    } else {
      date = moment(date)
    }
    console.log(`\nMrpProduct.planProduction: product="${product.caption}", date="${date.format(aDateFormat)}", qnt=${qnt}.`)

    // вычислим размер партии к производству на основании минимальной производственной партии и шага ее изменения
    let qntForProd = product.qntStep
    while (qntForProd < (qnt + product.qntMin)) {
      qntForProd += product.qntStep
    }
    console.log(`qntForProd = ${qntForProd}`)
    ret.qntForProd = qntForProd

    // добавить запись об этой производственной партии в остатки продукции:
    console.log(`Create Stock: type=prod, product="${product.caption}", date="${date.format(aDateFormat)}", qnt=${qnt}`)
    const aStock = Stock.create({
      type: 'prod',
      product: product.id,
      date: date.format(aDateFormat),
      qnt
    })

    // спланируем производство партии продукции
    // рассчитаем дату начала производства:
    const duration = await Product.prodDuration(productId)
    let startDate
    const endDate = moment(date)
    if (product.inWorkingDays) {
      startDate = endDate.businessSubtract(duration)
    } else {
      startDate = endDate.subtract(duration, 'days')
    }
    console.log(`duration=${duration}, startDate="${startDate.format(aDateFormat)}"`)

    // получим список этапов производства
    // отсортируем список этапов по порядку (и по идентификаторам)
    const stages = await Stage.findAll({ orderBy: ['order','id'], where: { product: productId }})
    console.log(`Stages for product "${product.caption}": ${JSON.stringify(stages)}`)

    // начальная дата производства и первого этапа:
    let stageStart = moment(startDate)
    await Promise.all(stages.map(async (stage) => {
      // для этого этапа получим список требуемых ресурсов
      console.log(`stage: ${stage.order} "${stage.caption}"`)
      const stageResources = await StageResource.findAll({ where: { stage: stage.id }})

      // обработаем список ресурсов
      await Promise.all(stageResources.map(async (stageResource) => {
        // для каждого ресурса получим его количество на складе на начало этапа:
        const stockQnt = await ResourceStock.qntForDate(stageResource.resource, stageStart)

        // TODO: нужно получить список партий ресурсов на дату - из чего состоит остаток

        // TODO:  почему startDate и stageStart перепутаны? Ресурсы на дату этапа или начала производства?

        // вычислим требуемое количество ресурса для данного этапа
        const reqQnt = qnt / product.baseQnt * stageResource.qnt
        const aResource = await Resource.findById(stageResource.resource)

        console.log(`Resource: ${stageResource.resource} "${aResource.caption}" stock=${stockQnt}, resource.minStock=${aResource.minStock}, req=${reqQnt}`)

        // если есть дефицит ресурсов - спланировать его закупку
        // TODO: учесть толерантность к дефициту ресурса при работе на грани minStock:
        if (reqQnt > (stockQnt - aResource.minStock)) {
          // заказываем такое количество ресурсов, чтобы на начало этапа было как минимум требуемое количество плюс мин запас
          await Resource.planOrderRes(aResource.id, stageStart, (reqQnt + aResource.minStock - stockQnt))
        }

        // увеличить дату на длительность этапа:
        product.inWorkingDays
          ? startDate = startDate.businessAdd(stage.duration)
          : startDate = startDate.add(stage.duration, 'days')

        // TODO: списываем из имеющихся партий ресурсов
        // списать ресурсы на производство датой окончания этапа:
        const rStock = await ResourceStock.create({
          type: 'prod',
          resource: stageResource.resource,
          date: startDate.format(aDateFormat),
          qnt: -reqQnt,
          comments: `res ${aResource.caption} stage: ${stage.order} ${stage.caption}`
        })
      }))
    }))
    console.log(`MrpProduct.planProduction: end, ret = ${JSON.stringify(ret)}`)
    return ret
  }

  return {
    name: 'MrpProduct',
    caption: 'Продукция',
    description: 'Продукция и базовые сведения о ней',
    seedFileName: 'mrp-product.json',
    icon: 'BarChart',
    prodDuration,
    planProduction,
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
        description: 'Название продукции',
        default: ''
      },
      {
        name: 'unit',
        type: 'text',
        format: '',
        caption: 'Единица',
        description: 'Единица измерения количества продукции',
        default: ''
      },
      {
        name: 'initialDate',
        type: 'datetime',
        caption: 'Дата',
        description: 'Начальная дата появления данной продукции',
        format: 'DD-MM-YYYY',
        default: null
      },
      {
        name: 'qntMin',
        type: 'decimal',
        caption: 'Количество',
        description: 'Минимальная партия для заказа в производство',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'qntStep',
        type: 'decimal',
        caption: 'Шаг',
        description: 'Минимальный шаг изменения количества в заказе в производство',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'baseQnt',
        type: 'decimal',
        caption: 'База',
        description: 'Базовое количество продукции, относительно которого установлены нормы расхода (например, "на 100 штук")',
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
        description: 'Длительность этапов производства указана в рабочих днях',
        default: false
      },
      {
        name: 'comments',
        type: 'text',
        format: '',
        caption: 'Примечания',
        description: 'Примечания о продукции в свободной форме',
        default: ''
      }
    ]
  }
}
