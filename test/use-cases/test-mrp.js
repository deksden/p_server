/* eslint-env mocha */
import { describe, it, before, beforeEach, after } from 'mocha'
import supertest from 'supertest'
import chai, { expect } from 'chai'
import dirtyChai from 'dirty-chai'
import env from 'dotenv-safe'
import _ from 'lodash'

import { appBuilder as App } from '../../src/packages/app-builder.mjs'

import {
  // UserFirst,
  // userList,
  loginAs,
  signupUser,
  meGroups,
  userGroupAdd,
  userGroupUsersAdd,
  permissionUserGroupCreate,
  noteAdd,
  noteSave,
  userGroupUsersList,
  userGroupUsersRemove,
  meGrantAdd,
  noteList,
  meAccess,
  me,
  createAdmin,
  createGroupManagers,
  createUserFirst,
  createPermsForNoteForManagers,
  setAdminToken,
  setUserFirstToken,
  createUserSecond
  // userDelete,
  // userSave
} from '../client/client-api.mjs'
import * as ACCESS from '../../src/packages/const-access.mjs'
import { ExtTest } from '../../src/ext-test/ext-test.mjs'
import { ExtMrp } from '../../src/ext-mrp/ext-mrp.mjs'
import { appInit } from '../../src/packages/app-init.mjs'
import { expected, UserAdmin, UserFirst, UserSecond } from '../client/client-const.mjs'
import { mrpPlanAdd } from '../client/client-mrp.mjs'
import moment from 'moment'

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
      return createAdmin(context)
        .then(() => app.exModular.services.seed('MrpPlan', 'test-mrp-plan1.json'))
        .then(() => app.exModular.models.MrpPlan.qntForDate('bmx', '01-06-2018'))
        .then((res) => {
          expect(res).to.be.equal(32500)
        })
        .then(() => app.exModular.models.MrpPlan.qntForDate('?', '01-06-2018'))
        .then((res) => {
          expect(res).to.be.null()
        })
        .catch((e) => { throw e })
    })
    it('1.2: MrpProductStock.qntForDate', function () {
      return createAdmin(context)
        .then(() => app.exModular.models.MrpProductStock.qntForDate('bmx', '15-01-2018'))
        .then((res) => {
          expect(res).to.be.equal(3500)
        })
        .then(() => app.exModular.models.MrpProductStock.qntForDate('bmx', '26-01-2018'))
        .then((res) => {
          expect(res).to.be.equal(11500)
        })
        .then(() => app.exModular.models.MrpProductStock.qntForDate('?', '26-01-2018'))
        .then((res) => {
          expect(res).to.be.null()
        })
        .catch((e) => { throw e })
    })
    it('1.3: MrpProduct.prodDuration', function () {
      return createAdmin(context)
        .then(() => app.exModular.services.seed('MrpStage', 'test-mrp-stage1.json'))
        .then(() => app.exModular.models.MrpProduct.prodDuration('bmx'))
        .then((res) => {
          expect(res).to.be.equal(31)
        })
        .then(() => app.exModular.models.MrpProduct.prodDuration('?'))
        .then((res) => {
          expect(res).to.be.null()
        })
        .catch((e) => { throw e })
    })
  })
  describe('MRP us-1:', function () {
    it('1.1:', function () {
      return createAdmin(context)
        .then(() => mrpPlanAdd(context, {
          id: 1,
          date: '01-03-2018',
          product: 'bmx',
          qnt: 10000
        }))
        .catch((e) => { throw e })
    })
  })
})
