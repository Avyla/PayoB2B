export class AppError extends Error {
  public readonly isOperational: boolean;

  constructor(
    public override readonly message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
