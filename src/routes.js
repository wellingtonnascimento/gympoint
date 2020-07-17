import { Router } from 'express';
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import StudentsController from './app/controllers/StudentsController';
import PlansController from './app/controllers/PlansController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

/**
 * Authentication middleware, all routes that
 * need authenticated user comes after this
 */

routes.use(authMiddleware);

routes.put('/users', UserController.update);

routes.post('/students', StudentsController.store);
routes.get('/students', StudentsController.index);
routes.put('/students/:id', StudentsController.update);

routes.post('/plans', PlansController.store);

routes.put('/plans/:id', PlansController.update);

export default routes;
