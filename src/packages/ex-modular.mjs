import _ from 'lodash'
import {isFunction} from "./utils/is-function.mjs";

export const exModular = (app) => {
  const ex = {}
  ex.app = app
  ex.modules = []
  ex.storages = []
  ex.models = {}
  ex.routes = []
  ex.services = {}
  ex.storages.default = null
  ex.access = {}
  ex.session = {}
  ex.init = []
  ex.seedVariantFolder = ''
  ex.moduleSet = {}

  ex.storages.byName = (name) => {
    if (name === 'default') {
      return ex.storages.default
    }
    return _.find(ex.storages, { name })
  }

  ex.modules.Add = (module) => {
    // check storage signature
    ex.modules.push(module)
  }

  ex.storages.Add = (storage) => {
    // check storage signature
    ex.storages.push(storage)
    if (ex.storages.length === 1) {
      ex.storages.default = storage
    }
  }

  ex.storages.Init = () => {
    if (!ex.storages || ex.storages.length < 1) {
      throw new Error('.storages should be initialized')
    }
    return Promise.all(ex.storages.map((storage) => storage.storageInit()))
      .catch((e) => { throw e })
  }

  ex.storages.Close = () => {
    if (!ex.storages || ex.storages.length < 1) {
      throw new Error('.storages should be initialized')
    }
    return Promise.all(ex.storages.map((storage) => storage.storageClose()))
      .catch(e => { throw e })
  }

  ex.storages.Clear = () => {
    if (!ex.storages || !ex.models) {
      throw new Error('.storages should be initialized before initializing model')
    }
    // return ex.services.serial(Object.keys(ex.models).map((modelName) => () => ex.models[modelName].dataClear()))
    return Promise.all(Object.keys(ex.models).map((modelName) => ex.models[modelName].dataClear()))
      .then(() => app.exModular.initAll())
      .catch((e) => { throw e })
  }

  ex.checkDeps = () => {
    ex.modules.map((item) => {
      if (!item.dependency) {
        throw new Error(`invalid module deps format: no .dependency property for ${item.toString()}`)
      }

      if (!item.moduleName) {
        throw new Error(`Module should have .moduleName in ${item.toString()}`)
      }

      if (!Array.isArray(item.dependency)) {
        item.dependency = [item.dependency]
      }

      item.dependency.map((dep) => {
        if (!_.has(ex, dep)) {
          throw new Error(`Module deps check error: ${item.moduleName} dep "${dep}" not found`)
        }
      })
    })

    // TODO: check models with references - if all model properties are defined and valid
  }

  // init models
  ex.modelsInit = (app) => {
    if (!ex.storages || !ex.models) {
      throw new Error('.storages should be initialized before initializing model')
    }

    ex.modules.map((module) => {
      if (module && module.models && Array.isArray(module.models)) {
        module.models.map((modelInit) => {
          if (isFunction(modelInit)) {
            ex.modelAdd(modelInit(app))
          }
        })
        return Promise.resolve()
      }
      return Promise.resolve()
    })

    return Promise.all(Object.keys(ex.models).map((modelName) => {
      const model = ex.models[modelName]
      if (!model.storage || model.storage === 'default') {
        model.storage = ex.storages.default
      }
      model.nameKebab = _.kebabCase(model.name)

      return model.schemaInit()
        .catch((e) => { throw e })
    })).catch((e) => { throw e })
  }

  /**
   * Декларативное описание модели
   * @typdef {Object} exModel
   * @property {string} name - имя модели, должно быть уникальным
   * @property {Object[]} props - массив свойств модели
   * @property {string} props.name - имя свойства
   * @property {Object} [storage] - опционально, хранилище модели
   *
   * (seedFileName)
   * */

  /**
   * Добавить модель в список моделей, обработать все параметры
   * @param {exModel} model - добавляемая модель типа exModel
   *
   * seeds[]: moduleName, seedFileName
   * */
  ex.modelAdd = (model) => {
    if (!model || !model.name || !model.props) {
      throw new Error(`exModular.modelAdd: invalid schema "${model}"`)
    }
    if (!model.storage) {
      model.storage = ex.storages.default
    }
    ex.models[model.name] = model.storage.modelFromSchema(model)

    ex.models[model.name].props.map((prop) => ex.models[model.name].props[prop.name] = prop)
  }


  ex.initAdd = (item) => {
    ex.init.push(item)
  }

  ex.initAll = () => {
    // add init from module.seeds:
    ex.modules.map((module) => {
      if (module.seeds && Array.isArray(module.seeds) && module.seeds.length > 0) {
        module.seeds.map((seed) => {
          if (seed.modelName && seed.seedFileName) {
            const seedInit = (app) => () => {
              console.log(`init seed: module "${seed.modelName}" - file "${seed.seedFileName}"`)
              return ex.services.seed(seed.modelName, seed.seedFileName)
                .catch((e) => { throw e })
            }
            ex.initAdd(seedInit(app))
          }
          return Promise.resolve()
        })
        return Promise.resolve()
      }
      return Promise.resolve()
    })

    // add init from models[i].seedFileName
    Object.keys(ex.models).map((modelName) => {
      const model = ex.models[modelName]
      if (model.seedFileName) {
        const seedInit = (app) => () => {
          console.log(`init seed: module "${model.name}" - file "${model.seedFileName}"`)
          return ex.services.seed(model.name, model.seedFileName)
            .catch((e) => { throw e })
        }
        ex.initAdd(seedInit(app))
        return Promise.resolve()
      }
      return Promise.resolve()
    })

    return ex.services.serial(ex.init)
      .catch((e) => {
        throw e
      })
  }

  /**
   * routes.Add: add routes to list of all routes in app
   * @param routes (Array<route> | Route): array or single route
   */
  ex.routes.Add = (routes) => {
    if (!routes) return
    // convert routes to array
    if (!Array.isArray(routes)) {
      routes = [routes]
    }
    (_.flattenDeep(routes)).map((item) => {
      ex.routes.push(item)
    })
  }
  return ex
}
