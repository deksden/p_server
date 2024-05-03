export const MrpRoutePlan = (app) => {

  const routeHandler = async (req, res) => {
    const Plan = app.exModular.models['MrpPlan']

    let version = ''
    if (req.query && req.query.version) {
      version = req.query.version
    }

    let clearData = true
    if (req.query && req.query.clear) {
      clearData = req.query.clear
    }

    const ret = await Plan.processAllPlans(version, clearData)

    res.setHeader('Last-Modified', (new Date()).toUTCString())
    res.send(ret)
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
