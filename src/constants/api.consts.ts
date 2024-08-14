export enum EServerResponseCodes {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,

    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,

    MOVED = 301,

    INTERNAL_SERVER_ERROR = 500,
}

export const API_ERROR_MAP: { [key in EServerResponseCodes]?: string } = {
    [EServerResponseCodes.BAD_REQUEST]: "Bad Request",
    [EServerResponseCodes.UNAUTHORIZED]: "Unauhtorised",
    [EServerResponseCodes.FORBIDDEN]: "Unauthenticated",
    [EServerResponseCodes.NOT_FOUND]: "Not found",
    [EServerResponseCodes.CONFLICT]: "Duplicate value",
    [EServerResponseCodes.MOVED]: "Permanently moved",
    [EServerResponseCodes.INTERNAL_SERVER_ERROR]: "Internal server error",
};

export enum EServerResponseRescodes {
    SUCCESS = 0,
    ERROR = 1,
    QUEUED = 2,
}
