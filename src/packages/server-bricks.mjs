import logger from 'morgan'
import path from 'path'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import Express from 'express'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import sqliteStorage from './storage-knex-sqlite.mjs'

import { exModular } from './ex-modular.mjs'

import { Wrap } from './services/service-wrap.mjs'
import { Mailer } from './services/service-mailer.mjs'
import { Errors } from './services/service-errors.mjs'
import { Validator } from './services/service-validator.mjs'
import { RouteBuilder } from './route-builder.mjs'
import { ControllerDF } from './services/service-controller-df.mjs'
import { Codegen } from './services/service-codegen.mjs'
import { Seed } from './services/sevice-seed.mjs'
import { Serial } from './services/service-serial.mjs'
import { Yandex } from '../ext-intg/service-yandex.mjs'

import { User } from './models/model-user.mjs'
import { UserGroup } from './models/model-user-group.mjs'
import { Session } from './models/model-session.mjs'
import { AccessObject } from './models/model-access-object.mjs'
import { PermissionUser } from './models/model-permission-user.mjs'
import { PermissionUserGroup } from './models/model-permission-user-group.mjs'

import { AuthJwt as Auth } from './auth-jwt.mjs'
import { AccessSimple as Access } from './access-simple.mjs'

import { InitAccess } from './init-access.mjs'
import { SignupOpen } from './signup-open.mjs'
import { AuthPassword } from './auth-password.mjs'
import { AuthSocial } from './auth-social.mjs'
import { Me } from './me.mjs'
import { UserDomain } from './models/model-user-domain.mjs'
import { UserSocial } from './models/model-user-social.mjs'
import { InitUserDomain } from './init-user-domain.mjs'
import { SessionSocial } from './models/model-session-social.mjs'
import { Intg } from '../ext-intg/intg.mjs'
import { Flow } from './services/service-flow.mjs'

export const serverBricks = (express, options) => {
  if (!express) {
    express = Express()
  }

  const app = express
  app.env = process.env

  // enhance with exModular object
  app.exModular = exModular(app)

  // make default config
  options = options || {}
  options.viewEngine = options.viewEngine || 'pug'
  options.viewPath = options.viewPath || path.join(__dirname, 'views')
  options.staticPath = options.staticPath || path.join(__dirname, 'public')
  options.logger = options.logger || logger
  options.loggerOptions = options.loggerOptions || 'dev'
  options.urlencodedOptions = options.urlencodedOptions || { extended: false }
  options.cors = options.cors || cors
  options.corsOptions = options.corsOptions || {
    origin: '*',
    allowedHeaders: 'Content-Type,Authorization,Content-Range,Accept,Accept-Encoding,Accept-Language,Location,Content-Location',
    exposedHeaders: 'Content-Type,Authorization,Content-Range,Accept,Accept-Encoding,Accept-Language,Location,Content-Location'
  }

  // return promise that builds app:
  return Promise.resolve()
    .then(() => {
      app.exModular.express = express

      // configure view engine / static engine:
      app.set('views', options.viewPath)
      app.set('view engine', options.viewEngine)
      app.use(Express.static(options.staticPath))

      // setup middlewares:
      app.use(options.logger(options.loggerOptions))
      app.use(Express.json())
      app.use(Express.urlencoded(options.urlencodedOptions))
      app.use(cookieParser())

      // init cors:
      const _cors = options.cors(options.corsOptions)
      app.use(_cors)
      app.options('*', _cors)

      // define services & other stuff:
      app.exModular.services.wrap = Wrap(app)
      app.exModular.services.mailer = Mailer(app)
      app.exModular.services.errors = Errors(app)
      app.exModular.services.validator = Validator(app)
      app.exModular.routes.builder = RouteBuilder(app)
      app.exModular.services.controllerDF = ControllerDF(app)
      app.exModular.services.seed = Seed(app)
      app.exModular.services.serial = Serial(app)
      app.exModular.services.yandex = Yandex(app)
      app.exModular.flow = Flow(app)

      app.exModular.auth = Auth(app)
      app.exModular.access = Access(app)

      // define storage:
      app.exModular.storages.Add(sqliteStorage(app))

      // define models:
      app.exModular.modelAdd(User(app))
      app.exModular.modelAdd(UserGroup(app))
      app.exModular.modelAdd(Session(app))
      app.exModular.modelAdd(SessionSocial(app))
      app.exModular.modelAdd(AccessObject(app))
      app.exModular.modelAdd(PermissionUser(app))
      app.exModular.modelAdd(PermissionUserGroup(app))
      app.exModular.modelAdd(UserDomain(app))
      app.exModular.modelAdd(UserSocial(app))

      // configure app with modules:
      SignupOpen(app)
      AuthPassword(app)
      AuthSocial(app)
      Me(app)
      Intg(app)

      Codegen(app)

      // configure system data init:
      app.exModular.initAdd(InitAccess(app))
      app.exModular.initAdd(InitUserDomain(app))

      // check deps among installed modules (plugins):
      app.exModular.checkDeps()

      return app
    })
    .then(() => app)
    .catch((err) => { throw err })
}

// module.exports = serverBricks
