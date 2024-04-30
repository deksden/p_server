import { reportProductStocks } from './reports/rpt-product-stock.mjs'
import { reportProductResources } from './reports/rpt-product-resources.mjs'
import { reportResourceOrders } from './reports/rpt-resource-orders.mjs'

export const MrpRouteReports = (app) => {

  const routeHandler = async (req, res) => {
    const Product = app.exModular.models['MrpProduct']

    const ctx = {}
    ctx.app = app
    await reportProductStocks(ctx)

    // вывести все калькуляции по всем продуктам:
    const products = await Product.findAll()
    for( const product of products ) {
      const c = { product }
      c.app = app
      await reportProductResources(c)
    }

    ctx.app = app
    await reportResourceOrders(ctx)

    res.send({})
  }

  app.exModular.routes.Add({
    method: 'GET',
    name: 'reports',
    description: 'Generate app reports',
    path: '/mrp/reports/all',
    // validate: checkModelName,
    handler: routeHandler
  })

  return app
}
