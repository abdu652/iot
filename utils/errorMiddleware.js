import { StatusCodes } from 'http-status-codes';

const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    let errorMessage = err.message || 'Internal Server Error';

    if (err.errors && err.name === 'ValidationError') {
        errorMessage = Object.values(err.errors)
            .map(item => item.message)
            .join(', ');
        statusCode = StatusCodes.BAD_REQUEST;    
    } 

    if (err.code && err.code === 11000) {
        errorMessage = `${Object.keys(err.keyValue).join(', ')} already exists`;   
        statusCode = StatusCodes.BAD_REQUEST;
    }
    res.status(statusCode).json({
        message: errorMessage,
        statusCode,     
    });
};

export default errorMiddleware;
