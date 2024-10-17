"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HTTP_statusCode;
(function (HTTP_statusCode) {
    HTTP_statusCode[HTTP_statusCode["OK"] = 200] = "OK";
    HTTP_statusCode[HTTP_statusCode["NoChange"] = 301] = "NoChange";
    HTTP_statusCode[HTTP_statusCode["TaskFailed"] = 304] = "TaskFailed";
    HTTP_statusCode[HTTP_statusCode["BadRequest"] = 400] = "BadRequest";
    HTTP_statusCode[HTTP_statusCode["Unauthorized"] = 401] = "Unauthorized";
    HTTP_statusCode[HTTP_statusCode["NoAccess"] = 403] = "NoAccess";
    HTTP_statusCode[HTTP_statusCode["NotFound"] = 404] = "NotFound";
    HTTP_statusCode[HTTP_statusCode["Conflict"] = 409] = "Conflict";
    HTTP_statusCode[HTTP_statusCode["Expired"] = 410] = "Expired";
    HTTP_statusCode[HTTP_statusCode["InternalServerError"] = 500] = "InternalServerError";
    HTTP_statusCode[HTTP_statusCode["ServiceUnavailable"] = 503] = "ServiceUnavailable";
})(HTTP_statusCode || (HTTP_statusCode = {}));
;
exports.default = HTTP_statusCode;
