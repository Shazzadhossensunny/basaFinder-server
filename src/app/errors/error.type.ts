export class PaymentError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}
