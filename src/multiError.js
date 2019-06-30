import os from 'os';

export function MultiError(errors) {
    const message = getCombinedMessage(errors);
    Error.call(this, message);
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, MultiError);
    }
    this.name = 'MultiError';
    this.errors = errors;
}

function getCombinedMessage(errors) {
    return errors.reduce((aggregate, nextError) => {
        return aggregate + nextError.message + os.EOL;
    }, '');
}