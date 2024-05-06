/**

 exModular project

 MRP module

 This module initialize "MRP" extension module.

*/
import { MrpPlan } from './models/mrp-plan.mjs'
import { MrpVendorTerm } from './models/mrp-vendor-term.mjs'
import { MrpVendorPayment } from './models/mrp-vendor-payment.mjs'
import { MrpStage } from './models/mrp-stage.mjs'
import { MrpProductStock } from './models/mrp-product-stock.mjs'
import { MrpProduct } from './models/mrp-product.mjs'
import { MrpResourceStock } from './models/mrp-resource-stock.mjs'
import { MrpResource } from './models/mrp-resource.mjs'
import { MrpStageResource } from './models/mrp-stage-resource.mjs'
import { MrpProductStage } from './models/mrp-product-stage.mjs'
// import { InitExtTest } from './init-mrp.mjs'
import { MrpRouteReports } from './routes/route-reports.mjs'
import { MrpRoutePlan } from './routes/route-plan.mjs'

const packageName = 'ExtMrp'

export const ExtMrp = (app, opt) => {
  app.exModular.services.seed.modelSet.MRP = [
    'MrpPlan',
    'MrpVendorTerm',
    'MrpVendorPayment',
    'MrpStage',
    'MrpStageResource',
    'MrpProductStock',
    'MrpProduct',
    'MrpProductStage',
    'MrpResource',
    'MrpResourceStock'
  ]

  app.exModular.modules.Add({
    moduleName: packageName,
    dependency: [
      'models',
      'modelAdd',
      'initAdd'
    ],
    models: [
      MrpPlan,
      MrpVendorTerm,
      MrpVendorPayment,
      MrpStage,
      MrpStageResource,
      MrpProductStock,
      MrpProduct,
      MrpProductStage,
      MrpResource,
      MrpResourceStock
    ]
  })

  MrpRouteReports(app)
  MrpRoutePlan(app)

  return app
}
