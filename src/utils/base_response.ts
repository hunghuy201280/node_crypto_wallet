export interface BaseResponse {
  message: string;
  statusCode: number;
  error : boolean;
}

/**
 * @desc    Send any success response
 *
 * @param   {string} message
 * @param   {object | array} results
 * @param   {number} statusCode
 */
export class SuccessResponse implements BaseResponse {
  public error: false = false;
  constructor(
    public message: string,
    public statusCode: number,
    public result: object
  ) {}
  
}

/**
 * @desc    Send any error response
 *
 * @param   {string} message
 * @param   {number} statusCode
 */
export class ErrorResponse implements BaseResponse {
  public error: true = true;

  constructor(public message: string, public statusCode: number) {
    const findCode = ErrorResponse.codes.find((code) => code == statusCode);

    if (!findCode) statusCode = 500;
    else statusCode = findCode;
  }
  static codes = [400, 401, 404, 403, 422, 500];
}
