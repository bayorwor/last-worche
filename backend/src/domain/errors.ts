// Domain errors. They describe what went wrong; errorHandler decides the HTTP status.
export class NotFoundError extends Error {}

export class BusinessRuleError extends Error {
  constructor(
    readonly rule: string,
    message: string,
  ) {
    super(message);
  }
}
