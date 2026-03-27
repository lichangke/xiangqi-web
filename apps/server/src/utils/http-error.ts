export class HttpError extends Error {
  statusCode: number;
  code: string;
  detail?: string;

  constructor(statusCode: number, code: string, message: string, detail?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.detail = detail;
  }
}
