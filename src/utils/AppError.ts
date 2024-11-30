class AppError extends Error {
    public readonly name: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(
        name: string = 'Error', 
        statusCode: number = 500, 
        description: string = 'An unexpected error occurred', 
        isOperational: boolean = true
    ) {
        super(description);
        
        Object.setPrototypeOf(this, new.target.prototype);

        this.name = name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string = 'Bad Request') {
        return new AppError('BadRequest', 400, message);
    }

    static unauthorized(message: string = 'Unauthorized') {
        return new AppError('Unauthorized', 401, message);
    }

    static forbidden(message: string = 'Forbidden') {
        return new AppError('Forbidden', 403, message);
    }

    static notFound(message: string = 'Not Found') {
        return new AppError('NotFound', 404, message);
    }

    static conflict(message: string = 'Conflict') {
        return new AppError('Conflict', 409, message);
    }
}

export default AppError;