import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app: Application = express();

//parsers
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
// app.use(
//   cors({ origin: ['https://bike-shop-ecru.vercel.app'], credentials: true }),
// );
// Add this before your routes

app.get('/', (req: Request, res: Response) => {
  res.send('Hello basaFinder !');
});

export default app;
