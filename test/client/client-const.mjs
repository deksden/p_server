const adminPassword = 'admin12345'
const userPassword = 'user12345'
export const UserAdmin = {
  name: 'John Admin',
  email: 'admin@email.net',
  password: adminPassword,
  isAdmin: true
}
export const UserFirst = {
  name: 'First User',
  email: 'user1@email.net',
  password: `${userPassword}_1`,
  isAdmin: false
}
export const UserSecond = {
  name: 'Second User',
  email: 'user2@email.net',
  password: `${userPassword}_2`,
  isAdmin: false
}
export const expected = {
  Ok: 200,
  OkCreated: 201,
  ErrCodeNotLogged: 401,
  ErrCodeForbidden: 403,
  ErrCodeNotFound: 404,
  ErrCodeInvalidParams: 412,
  ErrCodeError: 500,
  ErrCodeGeneric: 503
}
