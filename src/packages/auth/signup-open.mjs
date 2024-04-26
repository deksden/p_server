const packageName = 'Signup-open'

export const SignupOpen = (app) => {
  const Module = {
    moduleName: packageName,
    dependency: [
      'services.errors',
      'services.errors.ServerError',
      'services.errors.ServerGenericError',
      'services.validator',
      'services.validator.checkBodyForModelName',
      'services.validator.paramId',
      'models',
      'models.User',
      'models.User.create',
      'models.User.count',
      'access.addAdmin',
      'routes.Add'
    ],
    module: {}
  }

  app.exModular.modules.Add(Module)

  /*

  Signup code with flow tech:

  userCount:
    * models: User model,
    * input: userId,
    * output: userCount

  userFindByEmail:
    * models: User
    * input: email
    * output: user

  userCreate:
    * models: User
    * input: user
    * output: user

  */

  Module.module.signup = (req, res, next) => {
    const Errors = app.exModular.services.errors
    const User = app.exModular.models.User

    if (!req.data) {
      throw new Errors.ServerGenericError(
        `${packageName}.signup: Invalid request handling: req.data not initialized, use middleware to parse body`)
    }

    /*
    Generic signup code for "open" policy:
    * everybody can signup
    * first user will be admin automatically

    */
    let addUserAsAdmin = false
    let user = null

    return User.count()
      .then((userCount) => {
        if (userCount === 1) {
          addUserAsAdmin = true
        }
        return User.findOne({ where: { email: req.data.email } })
      })
      .then((_user) => {
        if (_user) {
          throw new Errors.ServerInvalidParameters('user.email', 'email', 'user with this email already registered')
        }
        return User.create(req.data)
      })
      .then((aUser) => {
        user = aUser
        if (addUserAsAdmin) {
          return app.exModular.access.addAdmin(user)
        }
      })
      .then(() => {
        res.data = user
        res.statusCode = 201
      })
      .catch((error) => {
        if (error instanceof Errors.ServerError) {
          throw error
        } else {
          throw new Errors.ServerGenericError(error)
        }
      })
  }

  const Validator = app.exModular.services.validator

  // define routes for this module
  Module.module.routes = [
    {
      method: 'POST',
      name: 'Auth.Signup',
      description: 'Open signup via username/password',
      path: '/auth/signup',
      before: [
        app.exModular.auth.check,
        app.exModular.access.check('Auth.Signup'),
        Validator.checkBodyForModelName('User', { optionalId: true })
      ],
      // handler: Module.module.signup,
      handler: 'authSignup',
      after: [
        app.exModular.services.controllerDF.sendData
      ],
      /*
      beforeHandler: [ app.exModular.auth.optional ],
      */
      type: 'Auth',
      object: 'Signup'
    }
  ]

  app.exModular.routes.Add(Module.module.routes)

  return app
}
