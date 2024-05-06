import { expected } from './client-const.mjs'

export const mrpPlanAdd = (context, data, expectedCode) => context.request.post(`${context.apiRoot}/mrpplan`)
  .set('Authorization', `${context.authSchema} ${context.token}`)
  .send(data)
  .type('json')
  .accept('json')
  .expect(expectedCode || expected.OkCreated)

export const mrpPlan = (context, data='', expectedCode=expected.Ok) => context.request.get(`${context.apiRoot}/mrp/plan?version=${data}`)
  .set('Authorization', `${context.authSchema} ${context.token}`)
  .type('json')
  .accept('json')
  .expect(expectedCode || expected.Ok)
