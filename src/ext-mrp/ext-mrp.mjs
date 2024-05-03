/**

 exModular project

 MRP module

 This module initialize "MRP" extension module.

*/
import { MrpPlan } from './mrp-plan'
import { MrpVendor } from './mrp-vendor'
import { MrpVendorPayment } from './mrp-vendor-payment'
import { MrpStage } from './mrp-stage'
import { MrpProductStock } from './mrp-product-stock'
import { MrpProduct } from './mrp-product'
import { MrpResourceStock } from './mrp-resource-stock'
import { MrpResource } from './mrp-resource'
import { MrpStageResource } from './mrp-stage-resource'
import { MrpProductStage } from './mrp-product-stage.mjs'
// import { InitExtTest } from './init-mrp.mjs'
import { MrpRouteReports } from './route-reports'
import { MrpRoutePlan } from './route-plan.mjs'

const packageName = 'ExtMrp'

export const ExtMrp = (app, opt) => {
  app.exModular.modules.Add({
    moduleName: packageName,
    dependency: [
      'models',
      'modelAdd',
      'initAdd'
    ],
    models: [
      MrpPlan,
      MrpVendor,
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
