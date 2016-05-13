// Express middleware for assigning a logger object to req.log:
function injectLogger(log) {
    return function (req, res, next) {
        var url = req.url;
        var method = req.method;
        req.log = log.createSublogger(req.ip).createSublogger(method + " " + url);

        next();
    };
}

// Express middleware for logging basic info about all requests:
function logRequests(opts) {
    var opts = opts || {};
    var threshold = opts.threshold || 500;

    return function (req, res, next) {
        var startTime = new Date();

        function writeLog() {
            var ms = new Date() - startTime;
            var level = 'info';
            if (ms >= threshold) level = 'warn';
            req.log.log(level, "sent response " + res.statusCode + " in " + ms + "ms");
        }

        if (res.finished) writeLog();
        else res.on('finish', writeLog);

        next();
    };
}

// Event handler for httpServer's 'listening' event, logging the host and port:
function listeningLogger(log) {
    return function () {
        var address = this.address();
        log.info("Listening on http://" + address.address + ":" + address.port);
    };
}

// Express middleware for writing errors to req.log:
function errorLogger(err, req, res, next) {
    req.log.error(err.stack ? err.stack : err.toString());
    next(err);
}

module.exports = {
    injectLogger: injectLogger,
    logRequests: logRequests,
    listeningLogger: listeningLogger,
    errorLogger: errorLogger
};
