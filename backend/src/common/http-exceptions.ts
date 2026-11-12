export class HttpException extends Error {
  constructor(
    private readonly response: Record<string, unknown>,
    private readonly status: number,
  ) {
    super(String(response.message ?? 'Request failed'));
  }

  getStatus(): number {
    return this.status;
  }

  getResponse(): Record<string, unknown> {
    return this.response;
  }
}

function createResponse(message: string | string[], error: string, statusCode: number) {
  return { statusCode, error, message };
}

export class BadRequestException extends HttpException {
  constructor(message: string | string[] = 'Bad Request') {
    super(createResponse(message, 'Bad Request', 400), 400);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(createResponse(message, 'Unauthorized', 401), 401);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(createResponse(message, 'Forbidden', 403), 403);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Not Found') {
    super(createResponse(message, 'Not Found', 404), 404);
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Conflict') {
    super(createResponse(message, 'Conflict', 409), 409);
  }
}

export class Logger {
  constructor(private readonly context: string) {}

  log(message: string): void {
    console.log(`[${this.context}] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[${this.context}] ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[${this.context}] ${message}`, error?.stack ?? '');
  }
}
