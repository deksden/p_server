import Express from 'express'
import { appBuilder } from './packages/app-builder.mjs'
import { serverBuilder } from './packages/server-builder.mjs'
import { appInit } from './packages/app-init.mjs'
// import { Deploy } from './ext-deploy/deploy'
import env from 'dotenv-safe'
// import { ExtFin } from './ext-fin/ext-fin'
import { ExtMrp } from './ext-mrp/ext-mrp.mjs'

// load .env
env.config()

let app = null

const express = Express()

// build app & server
appBuilder(express, {})
  .then((_app) => {
    app = _app
    // Deploy(app)
    // ExtFin(app)
    ExtMrp(app)
  })
  .then(() => appInit(app)) // init app
  .then(() => serverBuilder(app, {})) // init server
  .catch((e) => { throw e })
