const router = require('express').Router()

// Requiring Ltijs
const lti = require('ltijs').Provider

// Grading route
router.post('/grade', async (req, res) => {
  try {
    const idtoken = res.locals.token // IdToken
    const score = req.body.score // User numeric score sent in the body
    const token = req.body.token
    console.log('*************** GRADES API DEBUG LOGS STARTS HERE ***************')
    console.log('ltiKey: ' + token)
    // Creating Grade object
    const gradeObj = {
      userId: idtoken.user,
      activityProgress: 'Completed',
      timestamp: `${new Date()}`,
      gradingProgress: 'FullyGraded',
      scoreGiven: score / 100,
      scoreMaximum: 1,
    }
    // Selecting linetItem ID
    let lineItemId = idtoken.platformContext.endpoint.lineitem // Attempting to retrieve it from idtoken
    if (!lineItemId) {
      console.log('No line item id...')
      const response = await lti.Grade.getLineItems(idtoken, {
        resourceLinkId: true,
      })
      const lineItems = response.lineItems
      console.log('###########################################')
      console.log('line items: ' + lineItems)
      if (lineItems.length === 0) {
        // Creating line item if there is none
        console.log('Creating new line item')
        const newLineItem = {
          scoreMaximum: 1,
          label: req.body.label,
          tag: 'grade',
          resourceLinkId: idtoken.platformContext.resource.id,
        }
        const lineItem = await lti.Grade.createLineItem(idtoken, newLineItem)
        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
        console.log('line items: ' + lineItems)
        lineItemId = lineItem.id
      } else lineItemId = lineItems[0].id
    }
    console.log('\nline item id: ', lineItemId, '\ngrade object: ', gradeObj)
    console.log(idtoken.platformContext.endpoint.scope)
    // Sending Grade
    const responseGrade = await lti.Grade.submitScore(
      idtoken,
      lineItemId,
      gradeObj
    )
    res.end()
  } catch (e) {
    console.log('ERROR IN LTIJS: ', e.message)
    return res.status(500).send({ error: e.message })
  }
})

// Names and Roles route
router.get('/members', async (req, res) => {
  try {
    const result = await lti.NamesAndRoles.getMembers(res.locals.token)
    if (result) return res.send(result.members)
    return res.sendStatus(500)
  } catch (err) {
    console.log(err.message)
    return res.status(500).send(err.message)
  }
})

// Deep linking route
router.post('/deeplink', async (req, res) => {
  try {
    const resource = req.body
    const items = {
      type: 'ltiResourceLink',
      title: 'Ltijs Demo',
      custom: {
        name: resource.name,
        value: resource.value,
      },
    }

    const form = await lti.DeepLinking.createDeepLinkingForm(
      res.locals.token,
      items,
      { message: 'Successfully Registered' }
    )
    if (form) return res.send(form)
    return res.sendStatus(500)
  } catch (err) {
    console.log(err.message)
    return res.status(500).send(err.message)
  }
})

// Return available deep linking resources
router.get('/resources', async (req, res) => {
  const resources = [
    {
      name: 'Resource1',
      value: 'value1',
    },
    {
      name: 'Resource2',
      value: 'value2',
    },
    {
      name: 'Resource3',
      value: 'value3',
    },
  ]
  return res.send(resources)
})

// Get user and context information
router.get('/info', async (req, res) => {
  const token = res.locals.token
  const context = res.locals.context

  const info = {}
  if (token.userInfo) {
    if (token.userInfo.name) info.name = token.userInfo.name
    if (token.userInfo.email) info.email = token.userInfo.email
  }

  if (context.roles) info.roles = context.roles
  if (context.context) info.context = context.context

  return res.send(info)
})

router.get('/jwk-generator', (req, res) => {
  const jwk = {
    kty: 'RSA',
    e: 'AQAB',
    use: 'sig',
    kid: 'AB3EQiNYNBDokiqvnCPDKtSfNgE=',
    alg: 'RS256',
    n: 'ku4nAh29Jx_bCR-WLZ35RuRwJm-fZrm8ENutuM0Ihf_gYvo1LNCBcpdEOjtFh9JL1j9Gl_9zz0q3nubq_ha8ivvsQDp4pgNx0u96fa-KF-485BwjcO58tCiux6KF-WprrG6AIhN88AMOvqGmPzfepkMfbkQbN7EilmtmRSsL2SJsL5CU0ZP4rXGL1-McCWEaJ4VPJ-vZSWZxVxQBDjNDLLSNFS5X9sYDxqo6KQlkhUmRFq5OxuD19DPJY_l5Gg-rvmKvzDuMR6q0gRMd-OR_CyhlRtBj7uagYcX0y-DUnhCTSlD9MgTwTJlpy6Nkj39GR5hHO6NeQJqwdKQcH9oYoQ',
  }
  res.send(jwk.json())
})

// Wildcard route to deal with redirecting to routes that are actually React routes
router.get('/', (req, res) => res.sendFile('../public/index.js'))

module.exports = router
