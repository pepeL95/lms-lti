require('dotenv').config()
const path = require('path')
const routes = require('./src/routes')

const lti = require('ltijs').Provider
console.log(process.env.LTI_KEY)
// Setup
lti.setup(process.env.LTI_KEY,
  {
    url: 'mongodb://' + process.env.DB_HOST + ':' + process.env.DB_PORT + '/' + process.env.DB_NAME + '?authSource=admin',
    //connection: { user: process.env.DB_USER, pass: process.env.DB_PASS }
  }, {
    staticPath: path.join(__dirname, '/public'), // Path to static files
    cookies: {
      secure: false, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: '' // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
    devMode: true // Set DevMode to true if the testing platform is in a different domain and https is not being used
  })

// When receiving successful LTI launch redirects to app
lti.onConnect(async (token, req, res) => {
  console.log('token: ', token)
  return res.sendFile(path.join(__dirname, './public/index.html'))
})

// When receiving deep linking request redirects to deep screen
lti.onDeepLinking(async (token, req, res) => {
  return lti.redirect(res, '/deeplink', { newResource: true })
})

// Setting up routes
lti.app.use(routes)

// Setup function
const setup = async () => {
  await lti.deploy({ port: process.env.PORT })

  /**
   * Register platform
   */
  await lti.registerPlatform({
    url: 'https://canvas.instructure.com', 
    name: 'Canvas Instructure',
    clientId: '10000000000001',
    authenticationEndpoint: 'http://192.168.1.174/api/lti/authorize_redirect',
    accesstokenEndpoint: 'http://192.168.1.174/login/oauth2/token',
    authConfig: { method: 'JWK_SET', key: 'http://192.168.1.174/api/lti/security/jwks' }
  })
}

setup()