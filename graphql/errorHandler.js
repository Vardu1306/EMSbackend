
const formatGraphQLError = (formattedError, error) => {
    let originalError = error;

    // Find the original error inside nested wrappers
    while (originalError) {
        if (
            originalError.name === "ValidationError" ||
            originalError.name === "CastError" ||
            originalError.code === 11000
        ) {
            break;
        }

        originalError =
            originalError.originalError ||
            originalError.cause ||
            null;
    }

    // Duplicate email or department name
    if (originalError?.code === 11000) {
        return {
            message: "A record with this value already exists",
            locations: formattedError.locations,
            path: formattedError.path,
            extensions: {
                code: "CONFLICT"
            }
        };
    }

    // Mongoose validation errors
    if (originalError?.name === "ValidationError") {
        return {
            message: originalError.message,
            locations: formattedError.locations,
            path: formattedError.path,
            extensions: {
                code: "BAD_USER_INPUT"
            }
        };
    }

    // Invalid MongoDB ID
    if (originalError?.name === "CastError") {
        return {
            message: "Invalid ID provided",
            locations: formattedError.locations,
            path: formattedError.path,
            extensions: {
                code: "BAD_USER_INPUT"
            }
        };
    }

    return formattedError;
};

module.exports = formatGraphQLError;
