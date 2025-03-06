import { RequestHandler } from 'express';

export const fixShurjoPayUrl: RequestHandler = (req, res, next) => {
  if (req.url.includes('/api/payments/callback')) {
    req.url = req.url.replace(/\?/g, '&').replace('&', '?');
  }
  next();
};
