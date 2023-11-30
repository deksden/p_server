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
    const Product = app.exModular.models['MrpProduct']
    const Plan = app.exModular.models['MrpPlan']
    const Stock = app.exModular.models['MrpProductStock']
    const Stage = app.exModular.models['MrpStage']
    const StageResource = app.exModular.models['MrpStageResource']
    const Resource = app.exModular.models['MrpResource']
    const ResourceStock = app.exModular.models['MrpResourceStock']

    const product = await Product.findById(productId)
    const ret = {}

    const aDateFormat = Plan.props.date.format
    if (typeof date === 'string') {
      date = moment.utc(date, aDateFormat)
    } else {
      date = moment(date)
    }
    console.log(`\nMrpProduct.planProduction: product="${product.caption}", date="${date.format(aDateFormat)}", qnt=${qnt}.`)

    let qntForProd = product.qntStep
    while (qntForProd < (qnt + product.qntMin)) {
      qntForProd += product.qntStep
    }
    console.log(`qntForProd = ${qntForProd}`)
    ret.qntForProd = qntForProd

    // добавить запись о планах производства продукции в остатки
    console.log(`Create Stock: type=prod, product="${product.caption}", date="${date.format(aDateFormat)}", qnt=${qnt}`)
    const aStock = Stock.create({
      type: 'prod',
      product: product.id,
      date: date.format(aDateFormat),
      qnt
    })

    // спланируем производство партии продукции
    // рассчитаем дату начала этапа:
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
    // _.orderBy(stagesAPI.filterByProduct(productId), ['order', 'id'])
    await Promise.all(stages.map(async (stage) => {
      // для этого этапа получим список требуемых ресурсов
      console.log(`stage: ${stage.order} "${stage.caption}"`)
      const stageResources = await StageResource.findAll({ where: { stage: stage.id }})

      // обработаем список ресурсов
      await Promise.all(stageResources.map(async (stageResource) => {
        // для каждого ресурса получим его количество на складе на начало этапа:
        const stockQnt = await ResourceStock.qntForDate(stageResource.resource, stageStart)

        // вычислим требуемое количество ресурса для данного этапа
        const reqQnt = qnt / product.baseQnt * stageResource.qnt
        const aResource = await Resource.findById(stageResource.resource)

        console.log(`Resource: ${stageResource.resource} "${aResource.caption}" stock=${stockQnt}, resource.minStock=${aResource.minStock}, req=${reqQnt}`)

        // если есть дефицит ресурсов - спланировать его закупку
        if (reqQnt > (stockQnt - aResource.minStock)) {
          // заказываем такое количество ресурсов, чтобы на начало этапа было как минимум требуемое количество плюс мин запас
          console.log(`resourcesAPI.planOrderRes(${aResource.id}, ${stageStart}, ${reqQnt + aResource.minStock - stockQnt})`)
          await Resource.planOrderRes(aResource.id, stageStart, (reqQnt + aResource.minStock - stockQnt))
        }

        // увеличить дату на длительность этапа:
        product.inWorkingDays
          ? startDate = startDate.buisnessAdd(stage.duration)
          : startDate = startDate.add(stage.duration, 'days')

        // списать ресурсы на производство датой окончания этапа:
        const rStock = await ResourceStock.create({
          resource: stageResource.resource.id,
          type: 'prod',
          date: startDate.format(aDateFormat),
          qnt: -reqQnt,
          comments: `product ${stageResource.resource.id} stage: ${stage.order} ${stage.caption}`
        })
      }))
    }))
    console.log(`MrpProduct.planProduction: end, ret = ${JSON.stringify(ret)}`)
    return ret
  }

  return {
    name: 'MrpProduct',
    seedFileName: 'mrp-product.json',
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
        name: 'initialDate',
        type: 'datetime',
        caption: 'Дата',
        description: 'Начальная дата появления продукта',
        format: 'YYYY/MM/DD',
        default: null
      },
      {
        name: 'qntMin',
        type: 'decimal',
        caption: 'Количество',
        description: 'Минимальная партия производства',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'qntStep',
        type: 'decimal',
        caption: 'Шаг',
        description: 'Минимальная партия производства',
        precision: 12,
        scale: 0,
        format: '',
        default: 0
      },
      {
        name: 'baseQnt',
        type: 'decimal',
        caption: 'База',
        description: 'Базовое количество',
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
        description: 'Длительность указана в рабочих днях',
        default: false
      },
      {
        name: 'comments',
        type: 'text',
        format: '',
        caption: 'Примечания',
        description: 'Примечания',
        default: ''
      }
    ]
  }
}
