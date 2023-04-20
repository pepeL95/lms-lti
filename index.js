require('dotenv').config()
const path = require('path')
const routes = require('./src/routes')

const lti = require('ltijs').Provider

// Setup
lti.setup(process.env.LTI_KEY,
  {
    //url: 'mongodb://' + process.env.DB_HOST + ':' + process.env.DB_PORT + '/' + process.env.DB_NAME + '?authSource=admin',
    url: process.env.DB_URL,
    connection: { user: process.env.DB_USER, pass: process.env.DB_PASS }
  }, {
    staticPath: path.join(__dirname, '/public'), // Path to static files
    cookies: {
      secure: true, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: 'None' // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
    devMode: false // Set DevMode to true if the testing platform is in a different domain and https is not being used
  })

// When receiving successful LTI launch redirects to app
lti.onConnect(async (token, req, res) => {
  console.log('token: ', token)
  return res.render('index', {student_name: token.userInfo.name}) 
  // return res.sendFile(path.join(__dirname, './public/index.html'))
})

// When receiving deep linking request redirects to deep screen
lti.onDeepLinking(async (token, req, res) => {
  return lti.redirect(res, '/deeplink', { newResource: true })
})

// Setting up routes
lti.app.use(routes)

// Setting up view engine (EJS)
lti.app.set('view engine', 'ejs')
lti.app.set('views', path.join(__dirname, './dynamic_views'))

// Setup function
const setup = async () => {
  await lti.deploy({ port: process.env.PORT || 3000 })
// Register Platform
  await lti.registerPlatform({
    url: 'https://canvas.instructure.com', 
    name: 'Canvas Instructure',
    clientId: '130000000000931',
    authenticationEndpoint: 'https://usflearn.canvas.instructure.com/api/lti/authorize_redirect',
    accesstokenEndpoint: 'https://usflearn.canvas.instructure.com/login/oauth2/token',
    authConfig: { method: 'JWK_SET', key: 'https://usflearn.canvas.instructure.com/api/lti/security/jwks' }
  })
}

setup()

