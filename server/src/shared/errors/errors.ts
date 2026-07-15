export class DomainError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ConflictError extends DomainError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export class InvalidCredentialsError extends DomainError {
  // Same message for unknown-email and wrong-password — no user enumeration.
  constructor(message = "Invalid email or password") {
    super(message, 401);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export class ValidationError extends DomainError {
  constructor(message = "Validation failed") {
    super(message, 400);
  }
}
