/**

 exModular project

 MRP module

 This module initialize "MRP" extension module.

*/
import { MRP } from './model-mrp.mjs'
import { InitExtTest } from './init-mrp.mjs'

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
      MRP
    ]
  })

  // app.exModular.modelAdd(MRP(app))
  app.exModular.initAdd(InitExtTest(app))

  return app
}
