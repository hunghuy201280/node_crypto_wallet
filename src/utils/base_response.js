"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponse = exports.SuccessResponse = void 0;
/**
 * @desc    Send any success response
 *
 * @param   {string} message
 * @param   {object | array} results
 * @param   {number} statusCode
 */
class SuccessResponse {
    message;
    statusCode;
    result;
    constructor(message, statusCode, result) {
        this.message = message;
        this.statusCode = statusCode;
        this.result = result;
    }
}
exports.SuccessResponse = SuccessResponse;
/**
 * @desc    Send any error response
 *
 * @param   {string} message
 * @param   {number} statusCode
 */
class ErrorResponse {
    message;
    statusCode;
    error = true;
    constructor(message, statusCode) {
        this.message = message;
        this.statusCode = statusCode;
        const findCode = ErrorResponse.codes.find((code) => code == statusCode);
        if (!findCode)
            statusCode = 500;
        else
            statusCode = findCode;
    }
    static codes = [400, 401, 404, 403, 422, 500];
}
exports.ErrorResponse = ErrorResponse;
//# sourceMappingURL=base_response.js.map