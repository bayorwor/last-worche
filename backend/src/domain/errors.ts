// Domain errors. They describe what went wrong; errorHandler decides the HTTP status.
export class NotFoundError extends Error {}

export class UnauthorizedError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

export class ForbiddenError extends Error {}

export class BusinessRuleError extends Error {
  constructor(
    readonly rule: string,
    message: string,
    readonly values: Record<string, string | number> = {},
  ) {
    super(message);
  }
}

export class TooManyRequestsError extends Error {}
