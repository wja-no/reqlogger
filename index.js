function injectLogger(log) {
    return function (req, res, next) {
        var url = req.url;
        var method = req.method;
        req.log = log.createSublogger(req.ip).createSublogger(method + " " + url);

        next();
    };
}

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

function listeningLogger(log) {
    return function () {
        var address = this.address();
        log.info("Listening on http://" + address.address + ":" + address.port);
    };
}

function monkeypatchListen(app, log) {
    var listen = app.listen;
    app.listen = function () {
        var httpServer = listen.apply(this, arguments);
        httpServer.on('listening', listeningLogger(log, httpServer));
        return httpServer;
    };
}

function applyAll(app, log) {
    app.use(injectLogger(log));
    app.use(logRequests());
    monkeypatchListen(app, log);
}

module.exports = {
    injectLogger: injectLogger,
    logRequests: logRequests,
    listeningLogger: listeningLogger,
    monkeypatchListen: monkeypatchListen,
    applyAll: applyAll
};
