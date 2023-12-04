import fs from 'fs'
import mustache from 'mustache'
import _ from 'lodash'

const packageName = 'codegen'

export const Codegen = (app, opt) => {
  app.exModular.modules.Add({
    moduleName: packageName,
    dependency: [
      'services.errors',
      'services.errors.ServerInvalidParameters',
      'models'
    ]
  })

  if (!opt) {
    opt = {}
  }
  opt.template = opt.template || './data/templates/code-template.txt'
  const template = (fs.readFileSync(opt.template)).toString()

  const checkModelName = (req, res, next) => {
    if (!req.params.modelName) {
      next(new app.exModular.services.errors.ServerInvalidParameters(
        'modelName',
        'string',
        'ModelName should be specified for codegen'))
    }
    const Model = app.exModular.models[req.params.modelName]
    if (!Model || !Model.props) {
      next(new app.exModular.services.errors.ServerInvalidParameters(
        'modelName',
        'string',
        'ModelName invalid - not found'))
    }
    req.model = Model
    next()
  }

  const generateCodeForModel = (req, res) => {
    if (!req.model) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'modelName',
        'string',
        'req.model not found, use checkModelName middleware')
    }
    const txt = mustache.render(template, req.model)
    res.send(txt)
  }

  const generateList = (req, res) => {
    if (!req.model) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'modelName',
        'string',
        'req.model not found, use checkModelName middleware')
    }
    let txt = ''
    req.model.props.map((prop) => {
      if (!prop.caption) {
        prop.caption = prop.name
      }

      switch (prop.type) {
        case 'id':
          break
        case 'text':
          txt = txt + '<TextField source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />'
          break
        case 'decimal':
          txt = txt + '<NumberField source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />'
          break
        case 'datetime':
          txt = txt + '<DateField source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />'
          break
        case 'boolean':
          txt = txt + '<BooleanField source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />'
          break
        default:
          txt = txt + '<TextField source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />'
      }
    })
    res.send(txt)
  }

  const generateEdit = (req, res) => {
    if (!req.model) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'modelName',
        'string',
        'req.model not found, use checkModelName middleware')
    }
    let txt = ''
    req.model.props.map((prop) => {
      if (!prop.caption) {
        prop.caption = prop.name
      }

      switch (prop.type) {
        case 'id':
          txt = txt + '<TextInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' disabled className={classes.wide} />'
          break
        case 'text':
          txt = txt + '<TextInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />'
          break
        case 'decimal':
          txt = txt + '<NumberInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />'
          break
        case 'datetime':
          txt = txt + '<DateInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />'
          break
        case 'boolean':
          txt = txt + '<BooleanInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />'
          break
        default:
          txt = txt + '<TextInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />'
      }
    })
    res.send(txt)
  }

  const generateAppResources = (req, res) => {
    let txt = ''
    let models = Object.keys(app.exModular.models)

    if(req.query) {
      models = req.query.models
    }

    models.map((modelName) => {
      const Model = app.exModular.models[modelName]

      txt = txt +
        `<Resource\n` +
        `  name='${Model.name}'\n` +
        `  options={{label: '${Model.caption || Model.name}'}}\n` +
        `  list={${Model.name}List}\n` +
        `  icon={${Model.icon || "TableRowsIcon"}}\n` +
        `  edit={${Model.name}Edit}\n` +
        `  create={${Model.name}Create}\n` +
        `/>\n`
    })
    res.send(txt)
  }

  const generateAppImports = (req, res) => {
    let txt = ''
    let txt2 = 'import TableRowsIcon from \'@mui/icons-material/TableRows\'\n'
    let models = Object.keys(app.exModular.models)

    if(req.query) {
      models = req.query.models
    }

    models.map((modelName) => {
      const Model = app.exModular.models[modelName]

      txt = txt + `import {${Model.name}List, ${Model.name}Edit, ${Model.name}Create} from './resources/${_.kebabCase(Model.name)}'\n`

      if (Model.icon) {
        txt2 = txt2 + `import ${Model.icon}Icon from '@mui/icons-material/${Model.icon}'\n`
      }
    })

    txt = txt2 + '\n' + txt + '\n'
    res.send(txt)
  }

  const generateDocsForModel = (req, res) => {
    if (!req.model) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'modelName',
        'string',
        'req.model not found, use checkModelName middleware')
    }

    const model = req.model
    let txt = `### ${model.name}${model.caption ? `: ${model.caption}`: ""}\n` +
      `\n` +
      `${model.description || ''}\n` +
      `\n` +
      `Свойства:` +
      `\n`

    model.props.map((prop) => {
      let aType = prop.type

      if (prop.type === 'ref') {
        aType = `-> ${prop.model}`
      }
      txt = txt +
        `* \`${prop.name}\`(${aType}): ${prop.caption || ''}. ${prop.description || ''}\n`
    })

    txt = txt + '\n\n'

    res.send(txt)
  }

  app.exModular.routes.Add({
    method: 'GET',
    name: 'codegen',
    description: 'Generate code for model',
    path: '/codegen/model/:modelName',
    validate: checkModelName,
    handler: generateCodeForModel
  })

  app.exModular.routes.Add({
    method: 'GET',
    name: 'codegen',
    description: 'Generate list code for model',
    path: '/codegen/model/:modelName/list',
    validate: checkModelName,
    handler: generateList
  })

  app.exModular.routes.Add({
    method: 'GET',
    name: 'codegen',
    description: 'Generate list code for model',
    path: '/codegen/model/:modelName/edit',
    validate: checkModelName,
    handler: generateEdit
  })

  app.exModular.routes.Add({
    method: 'GET',
    name: 'codegen',
    description: 'Generate app resources',
    path: '/codegen/app/resources',
    handler: generateAppResources
  })

  app.exModular.routes.Add({
    method: 'GET',
    name: 'codegen',
    description: 'Generate app imports',
    path: '/codegen/app/imports',
    handler: generateAppImports
  })

  app.exModular.routes.Add({
    method: 'GET',
    name: 'codegen',
    description: 'Generate docs for model',
    path: '/codegen/docs/model/:modelName',
    validate: checkModelName,
    handler: generateDocsForModel
  })

  return app
}
