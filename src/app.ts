import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorhandler';
import notFound from './app/middlewares/notFound';
const app: Application = express();

//parsers
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
// app.use(
//   cors({ origin: ['https://bike-shop-ecru.vercel.app'], credentials: true }),
// );
// Add this before your routes

// Add this before your routes
// app.use(fixShurjoPayUrl);
//application routes
app.use('/api', router);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello basaFinder !');
});

app.use(globalErrorHandler);
app.use(notFound as any);

export default app;
