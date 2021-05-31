import {Request, Response, Router as expressRouter} from 'express'
import AppConfig from '../configs/app'
import creds from './credentials'

const router: expressRouter = expressRouter()

router.get('/', (req: Request, res: Response): void => {
	res.send(`You've reached api routes of ${AppConfig.appName}`)
})
router.use('/credentials', creds)

export default router
