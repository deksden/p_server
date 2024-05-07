/* eslint-env mocha */
import { describe, it, before, beforeEach, after } from 'mocha'
import supertest from 'supertest'
import chai, { expect } from 'chai'
import dirtyChai from 'dirty-chai'
import env from 'dotenv-safe'
// import _ from 'lodash'

import { appBuilder as App } from '../../src/packages/app-builder.mjs'

import {
  // UserFirst,
  // userList,
  // loginAs,
  // signupUser,
  // meGroups,
  // userGroupAdd,
  // userGroupUsersAdd,
  // permissionUserGroupCreate,
  // noteAdd,
  // noteSave,
  // userGroupUsersList,
  // userGroupUsersRemove,
  // meGrantAdd,
  // noteList,
  // meAccess,
  // me,
  // createGroupManagers,
  // createUserFirst,
  // createPermsForNoteForManagers,
  // setAdminToken,
  // setUserFirstToken,
  // createUserSecond
  // userDelete,
  // userSave
  createAdmin
} from '../client/client-api.mjs'
// import * as ACCESS from '../../src/packages/const-access.mjs'
// import { ExtTest } from '../../src/ext-test/ext-test.mjs'
import { ExtMrp } from '../../src/ext-mrp/ext-mrp.mjs'
import { appInit } from '../../src/packages/app-init.mjs'
// import { expected, UserAdmin, UserFirst, UserSecond } from '../client/client-const.mjs'
import { mrpPlan } from '../client/client-mrp.mjs'
// import moment from 'moment'
import path from 'path'
import fs from 'fs'

/**

*/

chai.use(dirtyChai)

// test case:
describe('MRP: tests', function () {
  env.config()
  process.env.NODE_ENV = 'test' // just to be sure
  let app = null

  const context = {
    request: null,
    apiRoot: '',
    authSchema: 'Bearer',
    adminToken: null,
    userToken: null
  }

  before((done) => {
    App()
      .then((a) => {
        app = a
        ExtMrp(app)
      })
      .then(() => appInit(app)) // init app
      .then(() => {
        context.request = supertest(app)
        done()
      })
      .catch(done)
  })

  after((done) => {
    app.exModular.storages.Close()
      .then(() => done())
      .catch(done)
  })

  beforeEach((done) => {
    app.exModular.storages.Clear()
      .then(() => done())
      .catch(done)
  })

  /* MRP Test plan:

    u-s-1:
      1-c1: проверить что аккаунт успешно создан
      1-c2: проверить что получен токен
      1-c3: проверить что он администратор
   */

  describe('MRP unit tests:', function () {
    it('1.1: MrpPlan.qntForDate', function () {
      const aFile = 'test-mrp-plan1.json'
      const fileName = path.join(process.env.SEEDS_DIR, aFile)
      const data = JSON.parse(fs.readFileSync(fileName).toString())

      const prodId = data[0].product
      const date3 = data[2].date

      const qnt1 = data[0].qnt
      const qnt2 = data[1].qnt
      const qnt3 = data[2].qnt

      return createAdmin(context)
        .then(() => app.exModular.services.seed.seedModelFromFile('MrpPlan', aFile))
        .then(() => app.exModular.models.MrpPlan.qntForDate(prodId, date3))
        .then((res) => {
          expect(res).to.be.equal(qnt1 + qnt2 + qnt3)
        })
        .then(() => app.exModular.models.MrpPlan.qntForDate('?', date3))
        .then((res) => {
          expect(res).to.be.null()
        })
        .catch((e) => { throw e })
    })
    it('1.2: MrpProductStock.qntForDate', function () {
      // load JSON data:
      const fileName = path.join(process.env.SEEDS_DIR, 'mrp-product-stock.json')
      const data = JSON.parse(fs.readFileSync(fileName).toString())

      // get data from file:
      const date1 = data[0].date
      const qnt1 = data[0].qnt
      const prodId = data[0].product

      const date2 = data[1].date
      const qnt2 = data[1].qnt

      return createAdmin(context)
        .then(() => app.exModular.models.MrpProductStock.qntForDate(prodId, date1))
        .then((res) => {
          expect(res).to.be.equal(qnt1)
        })
        .then(() => app.exModular.models.MrpProductStock.qntForDate(prodId, date2))
        .then((res) => {
          expect(res).to.be.equal(qnt1 + qnt2)
        })
        .then(() => app.exModular.models.MrpProductStock.qntForDate('?', date2))
        .then((res) => {
          expect(res).to.be.null()
        })
        .catch((e) => { throw e })
    })
    it('1.3: MrpProduct.prodDuration', function () {
      const aFile = 'test-mrp-stage1.json'
      const fileName = path.join(process.env.SEEDS_DIR, aFile)
      const data = JSON.parse(fs.readFileSync(fileName).toString())

      const prodId = data[0].product

      const duration1 = data[0].duration
      const duration2 = data[1].duration
      const duration3 = data[2].duration

      return createAdmin(context)
        .then(() => app.exModular.services.seed.seedModelFromFile('MrpStage', aFile))
        .then(() => app.exModular.models.MrpProduct.prodDuration(prodId))
        .then((res) => {
          expect(res).to.be.equal(duration1 + duration2 + duration3)
        })
        .then(() => app.exModular.models.MrpProduct.prodDuration('?'))
        .then((res) => {
          expect(res).to.be.null()
        })
        .catch((e) => { throw e })
    })
  })
  describe('MRP us-1: агрегирование закупки ресурса 1', function () {
    it('1.1:', async function () {
      const Models = app.exModular.models

      return createAdmin(context)
        .then(() => mrpPlan(context))
        .then(() => Models.MrpResourceStock.findOne({ where: { resource: 1, type: 'order' }, orderBy: [{ column: 'date', order: 'asc' }] }))
        .then((res) => {
          expect(res.resource).to.be.equal('1')
          expect(res.qnt).to.be.equal(1000)
          expect(res.qntReq).to.be.equal(920)
          expect(res.price).to.be.equal(990)
        })
        .catch((e) => { throw e })
    })
  })
  describe('MRP us-2: tSelector', function () {
    it('2.1 minPrice:', async function () {
      const Models = app.exModular.models

      return createAdmin(context)
        .then(() => mrpPlan(context, 'mrp-c3'))
        .then(() => Models.MrpResourceStock.findOne({
          where: { resource: 4, type: 'order' },
          whereOp: [
            { column: 'date', op: '>=', value: '01-10-2023' },
            { column: 'date', op: '<=', value: '31-10-2023' }
          ]
        }))
        .then((res) => {
          expect(res).to.be.not.undefined()
          expect(res.resource).to.be.equal('4')
          expect(res.price).to.be.equal(130)
          expect(res.term).to.be.equal('25')
        })
        .catch((e) => { throw e })
    })
    it('2.1 minDuration:', async function () {
      const Models = app.exModular.models

      return createAdmin(context)
        .then(() => mrpPlan(context, 'mrp-c4'))
        .then(() => Models.MrpResourceStock.findOne({
          where: { resource: 4, type: 'order' },
          whereOp: [
            { column: 'date', op: '>=', value: '01-10-2023' },
            { column: 'date', op: '<=', value: '31-10-2023' }
          ]
        }))
        .then((res) => {
          expect(res).to.be.not.undefined()
          expect(res.resource).to.be.equal('4')
          expect(res.price).to.be.equal(155)
          expect(res.term).to.be.equal('22')
        })
        .catch((e) => { throw e })
    })
  })
})
