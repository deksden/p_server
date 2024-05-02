import { reportProductStocks } from './reports/rpt-product-stock.mjs'
import { reportProductResources } from './reports/rpt-product-resources.mjs'
import { reportResourceOrders } from './reports/rpt-resource-orders.mjs'

export const MrpRouteReports = (app) => {

  const routeHandler = async (req, res) => {
    const Product = app.exModular.models['MrpProduct']
    const ret = []

    const ctx = {}
    ctx.app = app
    ret.push(await reportProductStocks(ctx))

    // вывести все калькуляции по всем продуктам:
    const products = await Product.findAll()
    for( const product of products ) {
      const c = { product }
      c.app = app
      ret.push(await reportProductResources(c))
    }

    ctx.app = app
    ret.push(await reportResourceOrders(ctx))

    await new Promise(resolve => setTimeout(resolve, 1000))

    res.setHeader('Last-Modified', (new Date()).toUTCString())
    res.send({ items: ret })
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
