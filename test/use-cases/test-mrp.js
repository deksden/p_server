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
