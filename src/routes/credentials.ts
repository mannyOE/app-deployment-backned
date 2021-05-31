import {Router as expressRouter} from 'express'
import {credentialsCtrl} from '../controllers'
import Auth from '@src/middlewares/auth'
import Val from '@src/middlewares/validations'
const auth = new Auth()
const val = new Val()

/**
 * @category Routers
 */
const router: expressRouter = expressRouter()

/**
 * complete gitlab integration
 */
router.post(
	'/gitlab',
	auth.verify(),
	Val.gitlab(),
	val.validate(),
	credentialsCtrl.integrateGitlab()
)

router.get(
	'/gitlab-projects/:app',
	auth.verify(),
	credentialsCtrl.fetchGitlabProjects()
)

router.post(
	'/add-gitlab-project',
	auth.verify(),
	Val.addGitlabProject(),
	val.validate(),
	credentialsCtrl.addGitlabProject()
)

// bitbucket
router.post(
	'/bitbucket',
	auth.verify(),
	Val.gitlab(),
	val.validate(),
	credentialsCtrl.integrateBitbucket()
)

router.get(
	'/bitbucket-projects/:app',
	auth.verify(),
	credentialsCtrl.fetchBitbucketProjects()
)

router.post(
	'/add-bitbucket-project',
	auth.verify(),
	Val.addBitbucketProject(),
	val.validate(),
	credentialsCtrl.addBitbucketProject()
)

// Github
router.post(
	'/github',
	auth.verify(),
	Val.gitlab(),
	val.validate(),
	credentialsCtrl.integrateGithub()
)

router.get(
	'/github-projects/:app',
	auth.verify(),
	credentialsCtrl.fetchGithubProjects()
)

router.post(
	'/add-github-project',
	auth.verify(),
	Val.addGithubProject(),
	val.validate(),
	credentialsCtrl.addGithubProject()
)

router.post(
	'/server/test',
	auth.verify(),
	Val.server(),
	val.validate(),
	credentialsCtrl.testServerConfig()
)

router.post(
	'/server/save',
	auth.verify(),
	Val.server(),
	val.validate(),
	credentialsCtrl.saveServerConfig()
)

/**
 * Fetch all peopl
 */
router.get('/fetch/:app', auth.verify(), credentialsCtrl.fetch())

router.patch('/reset/:app/:provider', auth.verify(), credentialsCtrl.reset())

router.patch('/set-default/:app/:provider', auth.verify(), credentialsCtrl.default())


router.post('/fetch-files-tree/:app/:module', auth.verify(), credentialsCtrl.fetchBranchFiles())
router.post('/fetch-a-file/:app/:module', auth.verify(), credentialsCtrl.fetchBranchFileUrl())
router.post('/create-files-tree/:app/:module', auth.verify(), credentialsCtrl.addToBranchFiles())


router.get('/fetch-submissions/:app/:module', auth.verify(), credentialsCtrl.fetchDiffFiles())
router.get('/intiate-qa-test/:app/:module', auth.verify(), credentialsCtrl.initQATest())
/**
 * Route to delete all people
 */
router.delete('/', auth.verify(), credentialsCtrl.delete())

router.get('/files/get/:app', auth.verify(), credentialsCtrl.getFiles())

router.put('/files/update/:app', auth.verify(), credentialsCtrl.updateFiles())

router.get('/files/commit/:app/:module', auth.verify(), credentialsCtrl.commitFiles())

export default router
