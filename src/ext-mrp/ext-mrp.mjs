/**

 exModular project

 MRP module

 This module initialize "MRP" extension module.

*/
import { MrpPlan } from './model-mrp-plan.mjs'
import { MrpVendor } from './model-mrp-vendor.mjs'
import { MrpVendorPayment } from './model-mrp-vendor-payment.mjs'
import { MrpStage } from './model-mrp-stage.mjs'
import { MrpProductStock } from './mrp-product-stock.mjs'
import { MrpProduct } from './mrp-product.mjs'
import { MrpResourceStock } from './mrp-resource-stock.mjs'
import { MrpResource } from './mrp-resource.mjs'
import { MrpStageResource } from './mrp-stage-resource.mjs'

// import { InitExtTest } from './init-mrp.mjs'

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
      MrpResource,
      MrpResourceStock
    ]
  })

  return app
}
