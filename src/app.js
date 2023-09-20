import Express from 'express'
import serverBricks from './packages/server-bricks'
import serverBuilder from './packages/server-builder'
import appInit from './packages/app-init'
// import { Deploy } from './ext-deploy/deploy'
import env from 'dotenv-safe'
// import { ExtFin } from './ext-fin/ext-fin'

// load .env

env.config()

let app = null

const express = Express()

// build app & server
serverBricks(express, {})
  .then((_app) => {
    app = _app
    // Deploy(app)
    // ExtFin(app)
  })
  .then(() => appInit(app)) // init app
  .then(() => serverBuilder(app, {})) // init server
  .catch((e) => { throw e })
