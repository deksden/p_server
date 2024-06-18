/**

 exModular project

 MRP module

 This module initialize "MRP" extension module.

*/
import { MrpDefCost } from './models/mrp-def-cost.mjs'
import { MrpDefProcessResource } from './models/mrp-def-process-resource.mjs'
import { MrpDefProcess } from './models/mrp-def-process.mjs'
import { MrpDefStage } from './models/mrp-def-stage.mjs'
import { MrpDefStock } from './models/mrp-def-stock.mjs'
import { MrpPlan } from './models/mrp-plan.mjs'
import { MrpRegCost } from './models/mrp-reg-cost.mjs'
import { MrpRegStage } from './models/mrp-reg-stage.mjs'
import { MrpRegStock } from './models/mrp-reg-stock.mjs'
import { MrpResource } from './models/mrp-resource.mjs'

import { MrpRouteReports } from './routes/route-reports.mjs'
import { MrpRoutePlan } from './routes/route-plan.mjs'

const packageName = 'ExtMrp'

export const ExtMrp = (app, opt) => {
  app.exModular.services.seed.modelSet.MRP = [
    'MrpPlan',
    'MrpDefProcess',
    'MrpDefProcessResource',
    'MrpDefCost',
    'MrpDefStage',
    'MrpDefStock',
    'MrpRegCost',
    'MrpRegStage',
    'MrpRegStock',
    'MrpResource'
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
      MrpDefCost,
      MrpDefProcess,
      MrpDefProcessResource,
      MrpDefStage,
      MrpDefStock,
      MrpRegCost,
      MrpRegStage,
      MrpRegStock,
      MrpResource
    ]
  })

  MrpRouteReports(app)
  MrpRoutePlan(app)

  return app
}
