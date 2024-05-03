import fs from 'fs'
import path from 'path'
import _ from 'lodash'

export const Seed = (app) => {
  const seedModelFromFile = async (modelName, fileName, opt = { upsert: true }) => {
    if (!opt) {
      opt = {}
    }
    opt.onlyIfEmpty = opt.onlyIfEmpty || false
    opt.upsert = opt.upsert || true

    console.log(`seed data from file "${fileName}" with opts ${JSON.stringify(opt)}`)

    const variantFile = path.join(process.env.SEEDS_DIR, app.exModular.services.seed.variantFolder, fileName)

    // можно указать полный путь к файлу - тогда, если такой файл существует - будем работать с ним,
    // игнорируя SEEDS_DIR и VARIANT_DIR
    if (!fs.existsSync(fileName)) {
      // если путь к файлу неполный, то будем составлять путь:
      fileName = path.join(process.env.SEEDS_DIR, fileName)
      if (fs.existsSync(variantFile)) fileName = variantFile
    }

    const Model = app.exModular.models[modelName]
    if (!Model) {
      throw Error(`Seed: model ${modelName} not found in app`)
    }

    // if no data file, then exit
    if (!fs.existsSync(fileName)) {
      console.log('no file for seeding, exiting')
      return Promise.resolve()
    }

    // load JSON data
    const data = JSON.parse(fs.readFileSync(fileName).toString())

    // process data:
    if (opt.onlyIfEmpty) {
      // proceed with checking if database is empty
      const count = await Model.count()
      if (count === 0) {
        for(const item of data) {
          await Model.create(item)
        }
      }
    } else if (opt.upsert) {
      // if upsert is true, then refresh data:
      for(const item of data) {
        if (item && item.id) {
          const found = await Model.findById(item.id)
          if (!found) {
            await Model.create(item)
          } else {
            await Model.update(item.id, item)
          }
        }
      }
    } else {
      // simply load all data as new data:
      for(const item of data) {
          await Model.create(item)
        }
    }

    return Promise.resolve()
  }

  /** загрузить все имеющиеся в системе данные
   * @param modelSet {string} (пустой по умолчанию) какой набор данных загружать, если ничего
   * не указано, то будут загружены данные всех модулей и всех моделей
   * @param opt {Object} параметры загрузки моделей, аналогичны opt как у метода seedModelFromFile
   * @return {Promise<any>}
   */
  const seedAll = async ( modelSet = '', opt = { upsert: true }) => {
    // массив, в котором будем хранить список данных для загрузки, содержит объекты формата
    // {modelName, seedFileName}
    let seedsToProcess = []
    let modelNames = Object.keys(app.exModular.models)

    // если нужно загружать только указанный список моделей:
    if (modelSet) {
      // проверим что такой набор есть
      if (!app.exModular.services.seed.modelSet[modelSet]) {
        throw Error(`Seed.seedAll: model set "${modelSet}" not found in app`)
      }

      // нужно загружать только те модели, которые указаны в наборе:
      modelNames = app.exModular.services.seed.modelSet[modelSet] // получили список
    }

    // теперь будем обрабатывать список данных об инициализации:
    // начнем с данных, указанных на уровне модулей:
    for (const module of app.exModular.modules) {
      if (module.seeds && Array.isArray(module.seeds)) {
        // обработаем данные модуля
        for (const seed of module.seeds) {
          // если эта модель есть в списке на загрузку
          if (_.find(modelNames, seed.modelName)) {
            seedsToProcess.push({ modelName: seed.modelName, seedFileName: seed.seedFileName })
          }
        }
      }
    }

    // теперь обработаем список моделей:
    for(const modelName in app.exModular.models) {
      const model = app.exModular.models[modelName]
      if(model.seedFileName) {
        seedsToProcess.push({ modelName, seedFileName: model.seedFileName })
      }
    }

    // список файлов для загрузки сформирован, выполним загрузку
    for(const aSeed of seedsToProcess) {
      await seedModelFromFile(aSeed.modelName, aSeed.seedFileName, opt)
    }

    return Promise.resolve()
  }

  return {
    modelSet: {},
    variantFolder: '',
    seedModelFromFile,
    seedAll
  }
}
