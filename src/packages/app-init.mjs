export const appInit = (app) => {
  return Promise.resolve()
    .then(() => app.exModular.storages.Init()) // init storages
    .then(() => app.exModular.modelsInit(app))
    .then(() => {
      app.exModular.routes.builder.forAllModels()
      return app.exModular.routes.builder.generateRoutes()
    })
    .then(() => app.exModular.initAll())
    .catch((e) => { throw e })
}

// module.exports = appInit
