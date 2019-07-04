import os from 'os';

export class MultiError extends Error {
    public errors: Error[];

    constructor(errors: Error[]) {
        const message = getCombinedMessage(errors);
        super(message);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MultiError);
        }
        this.name = 'MultiError';
        this.errors = errors;
    }
}

function getCombinedMessage(errors: Error[]): string {
    return errors.reduce((aggregate, nextError) => {
        return aggregate + nextError.message + os.EOL;
    }, '');
}