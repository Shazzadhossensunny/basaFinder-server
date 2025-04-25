import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorhandler';
import notFound from './app/middlewares/notFound';
import httpStatus from 'http-status-codes';
import { fixShurjoPayUrl } from './app/middlewares/fixShurjoPayUrl';
const app: Application = express();

//parsers
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
// app.use(
//   cors({
//     origin: [
//       'https://basafinder-frontend-nextjs-project-qpxcuhgt8-suunys-projects.vercel.app',
//     ],
//     credentials: true,
//   }),
// );
app.use(express.urlencoded({ extended: true }));
app.use(fixShurjoPayUrl);

// Add this before your routes
//application routes
app.use('/api', router);

app.get('/', (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: 'BasaFinder API is running!',
  });
});

app.use(globalErrorHandler);
app.use(notFound as any);

export default app;
