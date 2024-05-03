export const MrpRoutePlan = (app) => {

  const routeHandler = async (req, res) => {
    const Plan = app.exModular.models['MrpPlan']
    const ret = []

    let version = ''
    if (req.query && req.query.version) {
      version = req.query.version
    }

    // очистить данные
    app.exModular.seedVariantFolder = version
    await app.exModular.storages.Clear()

    // обработать все планы
    const plans = await Plan.findAll({ orderBy: ['date', 'product'] })
    for( const plan of plans ) {
      ret.push(await Plan.processPlan(plan.id))
    }

    res.setHeader('Last-Modified', (new Date()).toUTCString())
    res.send({ items: ret })
  }

  app.exModular.routes.Add({
    method: 'GET',
    name: 'plan',
    description: 'Generate plan (optionally use version parameter to set seed variant)',
    path: '/mrp/plan',
    // validate: checkModelName,
    handler: routeHandler
  })

  return app
}
