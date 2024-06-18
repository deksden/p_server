export const DENY = 0
export const ALLOW = 1
export const UNKNOWN = null

export const GUEST_ID = '12a507e4-d101-467a-97d4-f65a3b71f57c'
export const ADMIN_GROUP_ID = '416db26a-a15d-4c57-ac2d-786a69857f4d'
export const LOGGED_GROUP_ID = 'c4136a30-5e45-4555-a287-bf6c893417ff'

export const AccessSystemType = {
  unknown: { id: null, caption: '(unknown)' },
  Admin: { id: 'Admin', caption: 'ADMIN' },
  Logged: { id: 'Logged', caption: 'LOGGED' },
  User: { id: 'User', caption: 'User' },
}

export const AccessPermissionType = {
  unknown: { id: UNKNOWN, caption: '(unknown)' },
  DENY: { id: DENY, caption: 'DENY' },
  ALLOW: { id: ALLOW, caption: 'ALLOW' }
}
