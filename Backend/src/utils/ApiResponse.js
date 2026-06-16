// src/utils/ApiResponse.js

class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        // HTTP status codes < 400 mean success. Everything else is an error.
        this.success = statusCode < 400;
    }
}

export { ApiResponse };