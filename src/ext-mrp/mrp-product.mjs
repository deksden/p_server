import { v4 as uuid } from 'uuid'
import _ from 'lodash'
import moment from 'moment-business-days'

export const MrpProduct = (app) => {
  /** Рассчитать длительность производства
   * @param productId {number}: идентификатор продукта для которого считаем длительность производства
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

    // вычислим размер партии к производству на основании минимальной производственной партии и шага ее изменения,
    // будем повышать размер партии пока не получим как минимум нужное количество:
    let qntForProd = product.qntMin
    while (qntForProd < qnt) {
      qntForProd += product.qntStep
    }
    console.log(`qntForProd = ${qntForProd}`)
    ret.qntForProd = qntForProd

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
    const stages = _.cloneDeep(await Stage.findAll({ orderBy: ['order','id'], where: { product: productId }}))
    console.log(`Stages for product "${product.caption}": ${JSON.stringify(stages)}`)

    // начальная дата производства и первого этапа:
    let stageStart = moment(startDate)
    // await Promise.all(stages.map(async (stage)=> Promise.resolve().then( async () => {

    // перебираем все этапы производства:
    for (const stage of stages) {
      const fnStage = async (stage, stages) => {
        // для этого этапа получим список требуемых ресурсов
        console.log(`stage: ${stage.order} "${stage.caption}"`)
        const stageResources = _.cloneDeep(await StageResource.findAll({ where: { stage: stage.id }}))

        // обработаем список ресурсов
        console.log('resources for stage:')
        for (const stageResource of stageResources ) {
          const fnStageResource = async (stageResource, stageResources) => {
            console.log(` - stageResource=${JSON.stringify(stageResource)}`)
            let resStock = await ResourceStock.qntForDate(stageResource.resource, stageStart.format(aDateFormat))

            console.log(`  - stock: qnt ${resStock.qnt}`)
            console.log(`  - batches: ${JSON.stringify(resStock.batches)}`)

            // вычислим требуемое количество ресурса для данного этапа
            const reqQnt = qnt / product.baseQnt * stageResource.qnt
            const aResource = await Resource.findById(stageResource.resource)

            console.log(`Resource: id ${stageResource.resource}
              resource="${aResource.caption}"
              resStock.qnt=${resStock.qnt},
              resource.minStock=${aResource.minStock},
              reqQnt=${reqQnt}`)

            // если есть дефицит ресурсов - спланировать его закупку
            // TODO: учесть толерантность к дефициту ресурса при работе на грани minStock:
            if (reqQnt > (resStock.qnt - aResource.minStock)) {
              // заказываем такое количество ресурсов, чтобы на начало этапа было как минимум требуемое количество плюс мин запас
              await Resource.planOrderRes(aResource.id, stageStart, (reqQnt + aResource.minStock - resStock.qnt))

              // TODO: что делать, если заказ ресурса невозможен
              // обновляем данные о ресурсах, потому что заказаны недостающие ресурсы:
              resStock = await ResourceStock.qntForDate(stageResource.resource, stageStart)
            }

            // увеличить дату на длительность этапа:
            product.inWorkingDays
              ? startDate = startDate.businessAdd(stage.duration)
              : startDate = startDate.add(stage.duration, 'days')

            // списываем из имеющихся партий ресурсов
            // списать ресурсы на производство датой _начала_ (-окончания-) этапа:
            let restQnt = reqQnt // остаток ресурсов для списания
            let ndx = 0 // текущий индекс в списке партий ресурсов
            const maxBatches = resStock.batches.length
            while (restQnt > 0) {
              if (ndx>=maxBatches) {
                throw new Error('Invalid batches ndx!')
              }
              // берем текущую партию
              const aBatch = resStock.batches[ndx]
              if (aBatch.qnt >= restQnt) {
                // если текущей партии сырья хватает, чтобы покрыть остаток списываемых ресурсов, то:
                aBatch.qnt = aBatch.qnt - restQnt // скорректируем размер партии ресурсов
                await ResourceStock.create({ // зафиксируем списание ресурсов из этой партии
                  type: 'prod',
                  resource: stageResource.resource,
                  date: stageStart.format(aDateFormat), // startDate.format(aDateFormat),
                  qnt: -restQnt,
                  comments: `stage: ${stage.order} ${stage.caption}`,
                  batchId: aBatch.batchId,
                  dateProd: aBatch.dateProd,
                  dateExp: aBatch.dateExp,
                  price: aBatch.price,
                  vendor: aBatch.vendor
                })
                restQnt = 0
              } else {
                // если текущей партии ресурсов не хватает на текущее количество ресурсов к списанию,
                // то списать в размере остатка ресурсов из этой партии:
                await ResourceStock.create({ // зафиксируем списание ресурсов из этой партии
                  type: 'prod',
                  resource: stageResource.resource,
                  date: stageStart.format(aDateFormat), // startDate.format(aDateFormat),
                  qnt: -aBatch.qnt,
                  comments: `stage: ${stage.order} ${stage.caption}`,
                  batchId: aBatch.batchId,
                  dateProd: aBatch.dateProd,
                  dateExp: aBatch.dateExp,
                  price: aBatch.price,
                  vendor: aBatch.vendor
                })
                restQnt -= aBatch.qnt // уменьшим количество ресурсов к списанию на размер текущей партии
                aBatch.qnt = 0 // зафиксируем, что эта партия списана
                ndx += 1 // переходим к следующей партии
              }
            }
            // Цикл закончен, restQnt должен быть нулевым
          }
          await fnStageResource(stageResource, stageResources)
        }
      }
      await fnStage(stage, stages)
    }

    // добавить запись об этой производственной партии в остатки продукции:
    console.log(`Create Stock: type=prod, product="${product.caption}", date="${date.format(aDateFormat)}", qnt=${qnt}`)
    // TODO: посчитать стоимость всех ресурсов в учётной валюте и записать их здесь в переменную price:
    await Stock.create({
      type: 'prod',
      product: productId,
      date: date.format(aDateFormat),
      qnt: qntForProd
    })
    console.log(`MrpProduct.planProduction: end, ret = ${JSON.stringify(ret)}`)
    return Promise.resolve(ret)
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
