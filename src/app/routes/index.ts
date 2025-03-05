import { Router } from 'express';
import { AuthRoutes } from '../modules/Auth/auth.route';
import { UserRoute } from '../modules/User/user.route';
import { ListingRoutes } from '../modules/Listing/listing.route';
import { RequestRoutes } from '../modules/Request/request.routes';

const router = Router();

const moduleRoutes = [
  {
    path: '/users',
    route: UserRoute,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/listing',
    route: ListingRoutes,
  },
  {
    path: '/request',
    route: RequestRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
