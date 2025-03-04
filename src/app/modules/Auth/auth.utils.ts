import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

export const createToken = (
  jwtPayload: { email: string; role: string; userId: string },
  secret: string,
  expiresIn: number | StringValue,
) => {
  const options: SignOptions = {
    expiresIn: expiresIn,
  };
  return jwt.sign(jwtPayload, secret, options);
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
