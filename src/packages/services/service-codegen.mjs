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

  const generateModelCode = (req, res) => {
    if (!req.model) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'modelName',
        'string',
        'req.model not found, use checkModelName middleware')
    }
    // req.model.nameKebab = _.kebabCase(req.model.name)
    const txt = mustache.render(template, req.model)
    res.send(txt)
  }

  const generateModelListCode = (req, res) => {
    if (!req.model) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'modelName',
        'string',
        'req.model not found, use checkModelName middleware')
    }
    let txt = []
    req.model.props.map((prop) => {
      if (!prop.caption) {
        prop.caption = prop.name
      }

      switch (prop.type) {
        case 'id':
          break
        case 'text':
          txt.push('<TextField source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
          break
        case 'decimal':
          txt.push('<NumberField source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
          break
        case 'datetime':
          txt.push('<DateField source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
          break
        case 'boolean':
          txt.push('<BooleanField source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
          break
        case 'ref':
          txt.push(`<ReferenceField source='${prop.name}' label='${prop.caption}' reference='${prop.model}'>`)
          txt.push(`  <TextField source='caption' label='caption' />`)
          txt.push(`</ReferenceField>`)
          break
        default:
          txt.push('<TextField source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
      }
    })
    res.send(txt.join('\n'))
  }

  const generateModelEditCode = (req, res) => {
    if (!req.model) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'modelName',
        'string',
        'req.model not found, use checkModelName middleware')
    }
    let txt = []
    req.model.props.map((prop) => {
      if (!prop.caption) {
        prop.caption = prop.name
      }

      switch (prop.type) {
        case 'id':
          txt.push('<TextInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' disabled className={classes.wide} />')
          break
        case 'text':
          txt.push('<TextInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
          break
        case 'decimal':
          txt.push('<NumberInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
          break
        case 'datetime':
          txt.push('<DateInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
          break
        case 'boolean':
          txt.push('<BooleanInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
          break
        case 'ref':
          txt.push(`<ReferenceInput source='${prop.name}' label='${prop.caption}' reference='${prop.model}'>`)
          txt.push(`  <TextInput source='caption' label='caption' />`)
          txt.push(`</ReferenceInput>`)
          break
        default:
          txt.push('<TextInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
      }
    })
    res.send(txt.join('\n'))
  }

  const generateModelFilterCode = (req, res) => {
    if (!req.model) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'modelName',
        'string',
        'req.model not found, use checkModelName middleware')
    }
    const txt = []
    txt.push('<TextInput label=\'Search\' source=\'q\' alwaysOn />')

    req.model.props.map((prop) => {
      if (!prop.caption) {
        prop.caption = prop.name
      }

      switch (prop.type) {
        case 'id':
          // txt.push('<TextInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' disabled className={classes.wide} />\n'
          break
        case 'text':
          txt.push('<TextInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
          break
        case 'decimal':
          txt.push('<NumberInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
          break
        case 'datetime':
          txt.push('<DateInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
          break
        case 'boolean':
          txt.push('<BooleanInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
          break
        case 'ref':
          txt.push(`<ReferenceInput source='${prop.name}' label='${prop.caption}' reference='${prop.model}'>`)
          txt.push(`  <TextInput source='caption' label='caption' />`)
          txt.push(`</ReferenceInput>`)
          break
        default:
          txt.push('<TextInput source=\'' + prop.name + '\' label=\'' + prop.caption + '\' />')
      }
    })
    res.send(txt.join('\n'))
  }

  const generateModelImportComponents = (req, res) => {
    if (!req.model) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'modelName',
        'string',
        'req.model not found, use checkModelName middleware')
    }
    let data = {}
    req.model.props.map((prop) => {
      if (!prop.caption) {
        prop.caption = prop.name
      }

      if (prop.required) {
        data.required = {}
      }

      switch (prop.type) {
        case 'id':
          data.TextInput = {}
          data.TextField = {}
          break
        case 'text':
          data.TextInput = {}
          data.TextField = {}
          break
        case 'email':
          data.TextInput = {}
          data.EmailField = {}
          break
        case 'password':
          data.PasswordInput = {}
          data.TextField = {}
          break
        case 'ref':
          data.ReferenceInput = {}
          data.ReferenceField = {}
          break
        case 'refs':
          data.ReferenceArrayInput = {}
          data.ReferenceArrayField = {}
          break
        case 'datetime':
          data.DateInput = {}
          data.DateField = {}
          break
        case 'boolean':
          data.BooleanInput = {}
          data.BooleanField = {}
          break
        case 'enum':
          data.SelectInput = {}
          data.SelectField = {}
          break
        case 'decimal':
          data.NumberInput = {}
          data.NumberField = {}
          break
        case 'float':
          data.NumberInput = {}
          data.NumberField = {}
          break
        case 'calculated':
          data.TextInput = {}
          data.TextField = {}
          break
        default:
          data.TextInput = {}
          data.TextField = {}
      }
    })
    const list = Object.keys(data)
    const listAsString = list.join(',')
    res.send(listAsString)
  }

  const generateModelFieldDefs = (req, res) => {
    if (!req.model) {
      throw new app.exModular.services.errors.ServerInvalidParameters(
        'modelName',
        'string',
        'req.model not found, use checkModelName middleware')
    }

    let txt = ''
    // req.model.props.map((prop) => {
    //   if(prop.type === 'ref') {
    //     txt = `${txt}const ${req.model.name}${_.startCase(prop.name)}ListComponent = ({ record }) => <span>{record.caption}</span>\n`
    //   }
    // })

    res.send(txt)
  }

  const generateAppResources = (req, res) => {
    let txt = []
    let models = Object.keys(app.exModular.models)

    if(req.query) {
      models = req.query.models
    }

    models.map((modelName) => {
      const Model = app.exModular.models[modelName]

      txt.push(
        `<Resource\n` +
        `  name='${Model.name}'\n` +
        `  options={{ label: '${Model.caption || Model.name}' }}\n` +
        `  list={${Model.name}List}\n` +
        `  icon={${Model.icon || 'TableChart'}Icon}\n` +
        `  edit={${Model.name}Edit}\n` +
        `  create={${Model.name}Create}\n` +
        `/>`)
    })
    res.send(txt.join('\n'))
  }

  const generateAppImports = (req, res) => {
    let txt = []
    let txt2 = []
    txt2.push('import TableChartIcon from \'@material-ui/icons/TableChart\'')
    let models = Object.keys(app.exModular.models)
    const icons = []

    if(req.query) {
      models = req.query.models
    }

    models.map((modelName) => {
      const Model = app.exModular.models[modelName]

      txt.push(`import { ${Model.name}List, ${Model.name}Edit, ${Model.name}Create } from './resources/${_.kebabCase(Model.name)}'`)

      if (Model.icon && icons.indexOf(Model.icon) === -1) {
        txt2.push(`import ${Model.icon}Icon from '@material-ui/icons/${Model.icon}'`)
        icons.push(Model.icon)
      }
    })

    res.send(txt2.join('\n') + '\n' + txt.join('\n'))
  }

  const generateAppModels = (req, res) => {
    let models = Object.keys(app.exModular.models)

    res.send(models.join(', '))
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
    handler: generateModelCode
  })

  app.exModular.routes.Add({
    method: 'GET',
    name: 'codegen',
    description: 'Generate list code for model',
    path: '/codegen/model/:modelName/list',
    validate: checkModelName,
    handler: generateModelListCode
  })

  app.exModular.routes.Add({
    method: 'GET',
    name: 'codegen',
    description: 'Generate list code for model',
    path: '/codegen/model/:modelName/edit',
    validate: checkModelName,
    handler: generateModelEditCode
  })

  app.exModular.routes.Add({
    method: 'GET',
    name: 'codegen',
    description: 'Generate list code for model',
    path: '/codegen/model/:modelName/filter',
    validate: checkModelName,
    handler: generateModelFilterCode
  })

  app.exModular.routes.Add({
    method: 'GET',
    name: 'codegen',
    description: 'Generate import components code for model',
    path: '/codegen/model/:modelName/import-components',
    validate: checkModelName,
    handler: generateModelImportComponents
  })

  app.exModular.routes.Add({
    method: 'GET',
    name: 'codegen',
    description: 'Generate field definitions for model list / edit components',
    path: '/codegen/model/:modelName/field-defs',
    validate: checkModelName,
    handler: generateModelFieldDefs
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
    description: 'List all defined models',
    path: '/codegen/app/models',
    handler: generateAppModels
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
