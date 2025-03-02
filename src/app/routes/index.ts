import { Router } from 'express';

const router = Router();

const moduleRoutes = [
  //   {
  //     path: '/users',
  //     route: UserRoute,
  //   },
  {
    path: '/auth',
    route: AuthRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
