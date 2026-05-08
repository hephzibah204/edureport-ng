export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function badRequest(code: string, message: string): AppError {
  return new AppError(400, code, message);
}

export function unauthorized(message = "Unauthenticated"): AppError {
  return new AppError(401, "UNAUTHENTICATED", message);
}

export function forbidden(message = "Forbidden"): AppError {
  return new AppError(403, "FORBIDDEN", message);
}

export function notFound(message = "Not found"): AppError {
  return new AppError(404, "NOT_FOUND", message);
}
