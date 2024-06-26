import { v4 as uuid } from 'uuid'
import moment from 'moment-business-days'
import { momentAddDays, momentSubtractDays, makeMoment, printMoment } from '../../packages/utils/moment-utils.mjs'
import { reportProductStock } from '../reports/rpt-product-stocks.mjs'
import { reportProductResources } from '../reports/rpt-product-resources.mjs'
import { reportResourceOrders } from '../reports/rpt-resource-orders.mjs'

// XLSX.set_fs(fs)

export const MrpProduct = (app) => {
  /** Рассчитать длительность производства
   * @param productId {string}: идентификатор продукта для которого считаем длительность производства
   * @returns {Promise<number>} : длительность производства в днях (ссумируем длительность этапов)
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

  /** Выполнить планирование производства партии продукции
   *
   * @param productId {string}: код продукта
   * @param date {string|moment}: дата готовности продукта к передаче на склад
   * @param qnt {number}: количество продукта для производства
   * @param ctx {object}: объект контекста, ctx.plan
   * @return {Promise<Awaited<{}>>}
   */
  const planProduction = async (productId, date, qnt, ctx) => {
    // получаем API всех нужных объектов в системе
    const Product = app.exModular.models['MrpProduct']
    const Plan = app.exModular.models['MrpPlan']
    const ProductStock = app.exModular.models['MrpProductStock']
    const Stage = app.exModular.models['MrpStage']
    const StageResource = app.exModular.models['MrpStageResource']
    const Resource = app.exModular.models['MrpResource']
    const ResourceStock = app.exModular.models['MrpResourceStock']
    const ProductStage = app.exModular.models['MrpProductStage']

    // загружаем сведения о продукции:
    const product = await Product.findById(productId)

    const ret = {}

    // из свойств модели получаем формат даты, с которым работаем:
    const aDateFormat = Plan.props.date.format
    date = makeMoment(date, aDateFormat)

    console.log(`\nMrpProduct.planProduction: product="${product.caption}", date="${date.format(aDateFormat)}", qnt=${qnt}.`)

    // вычислим размер партии к производству на основании минимальной производственной партии и шага ее изменения,
    // будем повышать размер партии пока не получим как минимум нужное количество:
    let qntForProd = product.qntMin
    while (qntForProd < qnt) {
      qntForProd += product.qntStep
    }
    console.log(`qntForProd = ${qntForProd}`)
    ret.qntForProd = qntForProd

    // очистим данные о запланированных этапах производства:
    await ProductStage.removeAll({ where: { plan: ctx.plan.id }})

    // спланируем производство партии продукции
    // рассчитаем дату начала производства:
    const duration = await Product.prodDuration(productId)
    const endDate = date
    let startDate  = momentSubtractDays(endDate, duration, product.inWorkingDays)
    console.log(`duration=${duration}, startDate="${startDate.format(aDateFormat)}"`)

    // получим список этапов производства
    // отсортируем список этапов по порядку (и по идентификаторам)
    const stages = await Stage.findAll({ orderBy: ['order','id'], where: { product: productId }})
    console.log(`Stages for product "${product.caption}": ${JSON.stringify(stages)}`)

    // начальная дата производства и первого этапа:
    let stageStart = moment(startDate)
    // await Promise.all(stages.map(async (stage)=> Promise.resolve().then( async () => {
    let stageEnd = null
    let prodResSumm = 0

    // перебираем все этапы производства:
    for (const stage of stages) {
      // рассчитать дату завершения этапа
      stageEnd = momentAddDays(stageStart, stage.duration, product.inWorkingDays)

      // сделаем запись о запланированном этапе производства
      let productStage = {
        plan: ctx.plan.id,
        stage: stage.id,
        dateStart: stageStart.format(aDateFormat),
        dateEnd: stageEnd.format(aDateFormat),
        totalQntForProd: qntForProd
      }

      productStage = await ProductStage.create(productStage)
      ProductStage.print(productStage,' (created)')

      // if(!ctx.productStage) ctx.productStage = []
      // ctx.productStage.push(productStage)

      // для этого этапа получим список требуемых ресурсов
      console.log(`stage: ${stage.order} "${stage.caption}"`)
      const stageResources = await StageResource.findAll({ where: { stage: stage.id }})

      // будем запоминать общую стоимость потребленных ресурсов на этом этапе:
      let stageResSumm = 0

      // обработаем список ресурсов
      console.log('resources for stage:')
      for (const [itemNdx, stageResource] of stageResources.entries()) {
        StageResource.print(stageResource, ` #${itemNdx}`)
        // console.log(` - stageResource=${JSON.stringify(stageResource)}`)
        let resStock = await ResourceStock.qntForDate(stageResource.resource, stageStart.format(aDateFormat))

        console.log(`fn ResourceStock.qntForDate:
          qnt ${resStock.qnt}
          batches: ${JSON.stringify(resStock.batches)}`)

        // вычислим требуемое количество ресурса для данного этапа
        const reqQnt = qntForProd / stageResource.baseQnt * stageResource.qnt
        const aResource = await Resource.findById(stageResource.resource)

        Resource.print(aResource)

        // если есть дефицит ресурсов - спланировать его закупку
        // (?) учесть толерантность к дефициту ресурса при работе на грани minStock:
        if (reqQnt > (resStock.qnt - aResource.minStock)) {
          // заказываем такое количество ресурсов, чтобы на начало этапа было как минимум требуемое количество плюс мин запас
          await Resource.planOrderRes(aResource.id, stageStart, (reqQnt + aResource.minStock - resStock.qnt), ctx.plan.vendorTermSelector)

          // обновляем данные о ресурсах, потому что заказаны недостающие ресурсы:
          resStock = await ResourceStock.qntForDate(stageResource.resource, stageStart)
          console.log(`updated ResourceStock.qntForDate:
            qnt ${resStock.qnt}
            batches: ${JSON.stringify(resStock.batches)}`)
        }

        // списываем из имеющихся партий ресурсов
        // списать ресурсы на производство датой _начала_ этапа:
        let restQnt = reqQnt // остаток ресурсов для списания
        let ndx = 0 // текущий индекс в списке партий ресурсов
        const maxBatches = resStock.batches.length
        console.log(`Start while restQnt (${restQnt})`)
        while (restQnt > 0) {
          if (ndx>=maxBatches) {
            throw new Error('Invalid batches ndx!')
          }
          // берем текущую партию
          const aBatch = resStock.batches[ndx]
          console.log(`* processing batch[${ndx}]:
              qnt: ${aBatch.qnt}
              batchId: ${aBatch.batchId}
              vendorTerm: ${aBatch.vendorTerm}`)
          if (aBatch.qnt >= restQnt) {
            // если текущей партии сырья хватает, чтобы покрыть остаток списываемых ресурсов, то:
            aBatch.qnt = aBatch.qnt - restQnt // скорректируем размер партии ресурсов

            const aResStock = { // зафиксируем списание ресурсов из этой партии
              type: 'prod',
              resource: stageResource.resource,
              date: stageStart.format(aDateFormat), // startDate.format(aDateFormat),
              qnt: -restQnt,
              comments: `stage: ${stage.order} ${stage.caption}`,
              batchId: aBatch.batchId,
              dateProd: aBatch.dateProd ? moment(aBatch.dateProd).format(aDateFormat) : null,
              dateExp: aBatch.dateExp ? moment(aBatch.dateExp).format(aDateFormat) : null,
              price: aBatch.price,
              vendorTerm: aBatch.vendorTerm,
              productStage: productStage.id,
              stageResource: stageResource.id
            }

            // зафиксируем сумму потребленных ресурсов:
            stageResSumm += (aBatch.price * restQnt)
            ResourceStock.print(aResStock,'(v1 - big batch):')
            await ResourceStock.create(aResStock)
            restQnt = 0
          } else {
            // если текущей партии ресурсов не хватает на текущее количество ресурсов к списанию,
            // то списать в размере остатка ресурсов из этой партии:
            const aResStock = { // зафиксируем списание ресурсов из этой партии
              type: 'prod',
              resource: stageResource.resource,
              date: stageStart.format(aDateFormat), // startDate.format(aDateFormat),
              qnt: -aBatch.qnt,
              comments: `stage: ${stage.order} ${stage.caption}`,
              batchId: aBatch.batchId,
              dateProd: aBatch.dateProd ? moment(aBatch.dateProd).format(aDateFormat) : null,
              dateExp: aBatch.dateExp ? moment(aBatch.dateExp).format(aDateFormat) : null,
              price: aBatch.price,
              vendorTerm: aBatch.vendorTerm,
              productStage: productStage.id,
              stageResource: stageResource.id
            }

            // зафиксируем стоимость потребленных ресурсов
            stageResSumm += (aBatch.price * aBatch.qnt)

            ResourceStock.print(aResStock,'(v2 - batch is small):')
            await ResourceStock.create(aResStock)
            restQnt -= aBatch.qnt // уменьшим количество ресурсов к списанию на размер текущей партии
            aBatch.qnt = 0 // зафиксируем, что эта партия списана
            ndx += 1 // переходим к следующей партии
          }
        }
      }

      console.log(`checkpoint: ResSumm = ${stageResSumm}, qntForProd = ${qntForProd}, price = ${stageResSumm / qntForProd}`)
      // зафиксируем то, что мы рассчитали для этого этапа:
      productStage.price = stageResSumm / qntForProd
      productStage = await ProductStage.update(productStage.id, productStage)

      prodResSumm += stageResSumm
      stageResSumm = 0

      ProductStage.print(productStage, '(updated):')

      // вызовем функцию в цикле обработки этапов:
      // await fnStage(stage, stages)
      stageStart = momentAddDays(stageStart, stage.duration, product.inWorkingDays)
    }

    // добавить запись об этой производственной партии в остатки продукции:
    let aProductStock = {
      type: 'prod',
      product: productId,
      plan: ctx.plan.id,
      date: printMoment(date),
      dateStart: printMoment(startDate),
      qnt: qntForProd,
      price: prodResSumm / qntForProd
    }
    aProductStock =await ProductStock.create(aProductStock)
    ProductStock.print(aProductStock, '(created)')

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
      // {
      //   name: 'baseQnt',
      //   type: 'decimal',
      //   caption: 'База',
      //   description: 'Базовое количество продукции, относительно которого установлены нормы расхода (например, "на 100 штук")',
      //   precision: 12,
      //   scale: 0,
      //   format: '',
      //   default: 0
      // },
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
