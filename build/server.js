Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var http = tslib_1.__importStar(require("http"));
var fs_1 = tslib_1.__importDefault(require("fs"));
var path_1 = tslib_1.__importDefault(require("path"));
var url_1 = tslib_1.__importDefault(require("url"));
var express = tslib_1.__importStar(require("express"));
var session = tslib_1.__importStar(require("express-session"));
var helpers_1 = require("./helpers");
var default_responses_1 = require("./default-responses");
var cache_1 = require("./cache");
var errors_handler_1 = require("./errors-handler");
var files_handler_1 = require("./files-handler");
var directories_handler_1 = require("./directories-handler");
var Evnt = tslib_1.__importStar(require("./event"));
tslib_1.__exportStar(require("./application"), exports);
tslib_1.__exportStar(require("./event"), exports);
tslib_1.__exportStar(require("./logger"), exports);
var Server = /** @class */ (function () {
    function Server() {
        this.documentRoot = null;
        this.baseUrl = null;
        this.sessionMaxAge = null;
        this.sessionHashSalt = null;
        this.port = null;
        this.domain = null;
        this.development = true;
        this.httpServer = null;
        this.expressApp = null;
        this.sessionParser = null;
        this.cache = null;
        this.errorsHandler = null;
        this.filesHandler = null;
        this.directoriesHandler = null;
        this.customErrorHandler = null;
        this.customHttpHandlers = [];
        this.forbiddenPaths = [
            '/node_modules',
            /\/package(-lock)?\.json/g,
            /\/tsconfig\.json/g,
            /\/\.([^\.]+)/g
        ];
    }
    /**
     * @summary Create new server instance (no singleton implementation).
     */
    Server.CreateNew = function () {
        return new Server();
    };
    /**
     * @summary Set development mode, `true` by default. If `true`, directories contents and errors are displayed, `false` otherwise.
     * @param development If `true`, directories contents and errors are displayed, `false` otherwise.
     */
    Server.prototype.SetDevelopment = function (development) {
        this.development = development;
        return this;
    };
    /**
     * @summary Set http server IP or domain to listening on, `127.0.0.1` by default.
     * @param domain Server ip or domain to listening on.
     */
    Server.prototype.SetDomain = function (domain) {
        this.domain = domain;
        return this;
    };
    /**
     * @summary Set http server port number, `8000` by default.
     * @param port Server port to listening on.
     */
    Server.prototype.SetPort = function (port) {
        this.port = port;
        return this;
    };
    /**
     * @summary Set http server root directory, required
     * @param dirname Server root directory as absolute path.
     */
    Server.prototype.SetDocumentRoot = function (dirname) {
        this.documentRoot = path_1.default.resolve(dirname).replace(/\\/g, '/');
        return this;
    };
    /**
     * @summary Set http server base path, not required
     * @param baseUrl Base path (proxy path, if you are running the server under proxy).
     */
    Server.prototype.SetBaseUrl = function (baseUrl) {
        this.baseUrl = helpers_1.Helpers.Trim(baseUrl.replace(/\\/g, '/'), '/');
        return this;
    };
    /**
     * @summary Set session id cookie max age.
     * @param seconds Cookie max age in seconds, not miliseconds.
     */
    Server.prototype.SetSessionMaxAge = function (seconds) {
        this.sessionMaxAge = seconds;
        return this;
    };
    /**
     * @summary Set session id hash salt.
     * @param sessionHashSalt id hash salt.
     */
    Server.prototype.SetSessionHashSalt = function (sessionHashSalt) {
        this.sessionHashSalt = sessionHashSalt;
        return this;
    };
    /**
     * @summary Set custom error handler for uncatched errors and warnings
     * @param errorHandler Custom handler called on any uncatched error.
     */
    Server.prototype.SetErrorHandler = function (errorHandler) {
        this.customErrorHandler = errorHandler;
        return this;
    };
    /**
     * Set forbidden request paths to prevent requesting dangerous places (`["/node_modules", /\/package\.json/g, /\/tsconfig\.json/g, /\/\.([^\.]+)/g]` by default). All previous configuration will be overwritten.
     * @param forbiddenPaths Forbidden request path begins or regular expression patterns.
     */
    Server.prototype.SetForbiddenPaths = function (forbiddenPaths) {
        this.forbiddenPaths = forbiddenPaths;
        return this;
    };
    /**
     * Aet forbidden request paths to prevent requesting dangerous places (`["/node_modules", /\/package\.json/g, /\/tsconfig\.json/g, /\/\.([^\.]+)/g]` by default).
     * @param forbiddenPaths Forbidden request path begins or regular expression patterns.
     */
    Server.prototype.AddForbiddenPaths = function (forbiddenPaths) {
        this.forbiddenPaths = [].concat(this.forbiddenPaths, forbiddenPaths);
        return this;
    };
    /**
     * @summary Add custom express http handler
     * @param handler Custom http request handler called every allowed request path before standard server handling.
     */
    Server.prototype.AddHandler = function (handler) {
        this.customHttpHandlers.push(handler);
        return this;
    };
    /**
     * @summary Return `true` if development flag is used.
     */
    Server.prototype.IsDevelopment = function () {
        return this.development;
    };
    /**
     * @summary Return configured domain or ip address.
     */
    Server.prototype.GetDomain = function () {
        return this.domain;
    };
    /**
     * @summary Return configured port number.
     */
    Server.prototype.GetPort = function () {
        return this.port;
    };
    /**
     * @summary Return configured document root directory full path.
     */
    Server.prototype.GetDocumentRoot = function () {
        return this.documentRoot;
    };
    /**
     * @summary Return configured base url.
     */
    Server.prototype.GetBaseUrl = function () {
        return this.baseUrl;
    };
    /**
     * @summary Get session id cookie max age in seconds, not miliseconds.
     */
    Server.prototype.GetSessionMaxAge = function () {
        return this.sessionMaxAge;
    };
    /**
     * @summary Get session id hash salt.
     */
    Server.prototype.GetSessionHashSalt = function () {
        return this.sessionHashSalt;
    };
    /**
     * @summary Return configured custom errors handler.
     */
    Server.prototype.GetErrorHandler = function () {
        return this.customErrorHandler;
    };
    /**
     * Get forbidden request paths to prevent requesting dangerous places.
     */
    Server.prototype.GetForbiddenPaths = function () {
        return this.forbiddenPaths;
    };
    /**
     * @summary Return used http server instance
     */
    Server.prototype.GetHttpServer = function () {
        return this.httpServer;
    };
    /**
     * @summary Return used express app instance
     */
    Server.prototype.GetExpressApp = function () {
        return this.expressApp;
    };
    /**
     * @summary Return used express session parser instance
     */
    Server.prototype.GetExpressSessionParser = function () {
        return this.sessionParser;
    };
    /**
     * @summary Start HTTP server
     */
    Server.prototype.Run = function (callback) {
        var _this = this;
        if (callback === void 0) { callback = null; }
        var _a, _b;
        this.documentRoot = path_1.default.resolve(this.documentRoot || __dirname).replace(/\\/g, '/');
        this.port = this.port || Server.DEFAULTS.PORT;
        this.domain = this.domain || Server.DEFAULTS.DOMAIN;
        this.cache = new cache_1.Cache(this);
        this.errorsHandler = new errors_handler_1.ErrorsHandler(this, this.cache);
        this.filesHandler = new files_handler_1.FilesHandler(this.errorsHandler);
        this.directoriesHandler = new directories_handler_1.DirectoriesHandler(this, this.cache, this.filesHandler, this.errorsHandler);
        this.expressApp = express.default();
        this.httpServer = http.createServer(this.expressApp);
        this.sessionParser = session.default({
            httpOnly: true,
            secret: (_a = this.sessionHashSalt, (_a !== null && _a !== void 0 ? _a : Server.SESSION.HASH)),
            cookie: {
                maxAge: 1000 * (_b = this.sessionMaxAge, (_b !== null && _b !== void 0 ? _b : Server.SESSION.ID_MAX_AGE)) /* default is 1 hour */
            },
            resave: false,
            saveUninitialized: true
        });
        this.expressApp.use(this.sessionParser);
        this.expressApp.all('*', this.handleReq.bind(this));
        this.httpServer.on('error', function (e) {
            if (!callback) {
                console.error(e);
            }
            else {
                callback(false, e);
            }
        });
        this.httpServer.listen(this.port, this.domain, function () {
            if (!callback) {
                console.log("HTTP server has been started at: 'http://" + _this.domain + ":"
                    + _this.port.toString() + "' to serve directory: \n'" + _this.documentRoot
                    + "'.\nEnjoy browsing:-) To stop the server, pres CTRL + C or close this command line window.");
            }
            else {
                callback(true, null);
            }
        });
        return this;
    };
    /**
     * @summary Handle all HTTP requests
     */
    Server.prototype.handleReq = function (req, res, cb) {
        var _this = this;
        // prepare path and full path
        var path = helpers_1.Helpers.Trim(decodeURIComponent(url_1.default.parse(req.url).pathname), '/');
        var pathAllowed = this.isPathAllowed('/' + path);
        if (!pathAllowed)
            return this.directoriesHandler.HandleForbidden(res, cb);
        var fullPath = path_1.default.resolve(this.documentRoot + '/' + path).replace(/\\/g, '/');
        fullPath = helpers_1.Helpers.TrimRight(fullPath, '/');
        req.baseUrl = this.baseUrl !== null
            ? '/' + this.baseUrl
            : '';
        if (this.development)
            this.errorsHandler.SetHandledRequestProperties(req, res, cb);
        if (this.customHttpHandlers.length > 0) {
            var evnt = new Evnt.Event(req, res, cb, fullPath), index = 0;
            this.handleReqCustomHandlersRecursive(index, req, res, evnt, function () {
                if (evnt.IsPreventDefault()) {
                    cb();
                }
                else {
                    fs_1.default.stat(fullPath, _this.handleReqPathStats.bind(_this, path, fullPath, req, res, cb));
                }
            });
        }
        else {
            fs_1.default.stat(fullPath, this.handleReqPathStats.bind(this, path, fullPath, req, res, cb));
        }
    };
    /**
     * Get if path is allowed by `this.forbiddenPaths` configuration.
     * @param path Path including start slash, excluding base url and excluding params.
     */
    Server.prototype.isPathAllowed = function (path) {
        var result = true, beginPath, regExp, match;
        for (var i = 0, l = this.forbiddenPaths.length; i < l; i++) {
            if (this.forbiddenPaths[i] instanceof RegExp) {
                regExp = this.forbiddenPaths[i];
                match = path.match(regExp);
                if (match !== null && match.length > 0) {
                    result = false;
                    break;
                }
            }
            else {
                beginPath = this.forbiddenPaths[i].toString();
                if (path.indexOf(beginPath) === 0) {
                    result = false;
                    break;
                }
            }
        }
        return result;
    };
    /**
     * @summary Handle custom http handlers recursively:
     */
    Server.prototype.handleReqCustomHandlersRecursive = function (index, req, res, evnt, cb) {
        var _this = this;
        var handler = this.customHttpHandlers[index];
        var localCallback = function () {
            if (evnt.IsPreventDefault() || index + 1 == _this.customHttpHandlers.length) {
                cb();
            }
            else {
                _this.handleReqCustomHandlersRecursive(index + 1, req, res, evnt, cb);
            }
        };
        try {
            handler.call(null, req, res, evnt, localCallback);
        }
        catch (e) {
            this.errorsHandler.PrintError(e, req, res, 500);
            evnt.PreventDefault();
            localCallback();
        }
    };
    /**
     * @summary Check if any content exists for current reqest on hard drive:
     */
    Server.prototype.handleReqPathStats = function (path, fullPath, req, res, cb, err, stats) {
        if (err == null) {
            this.handleReqExistingPath(stats, path, fullPath, req, res, cb);
        }
        else if (err.code == 'ENOENT') {
            this.handleReqNonExistingPath(path, fullPath, req, res, cb);
        }
    };
    /**
     * @summary Process request content found
     */
    Server.prototype.handleReqExistingPath = function (stats, path, fullPath, req, res, cb) {
        var _this = this;
        if (stats.isDirectory()) {
            var originalPathname = url_1.default.parse(req.url).pathname;
            if (originalPathname.charAt(originalPathname.length - 1) == '/') {
                fs_1.default.readdir(fullPath, function (err, dirItems) {
                    if (err != null) {
                        _this.errorsHandler.PrintError(err, req, res, 403);
                        return cb();
                    }
                    _this.directoriesHandler.HandleDirectory(200, stats, path, fullPath, req, res, cb, dirItems);
                });
            }
            else {
                res.redirect(301, originalPathname + '/');
            }
        }
        else if (stats.isFile()) {
            this.filesHandler.HandleFile(stats, path, fullPath, req, res, cb);
        }
        else /* (
            stats.isBlockDevice() ||
            stats.isCharacterDevice() ||
            stats.isSymbolicLink() ||
            stats.isFIFO() ||
            stats.isSocket()
        )*/ {
            cb();
        }
    };
    /**
     * @summary Display error 500/404 (and try to list first existing parent folder content):
     */
    Server.prototype.handleReqNonExistingPath = function (path, fullPath, req, res, cb) {
        var _this = this;
        var pathExploded = path.split('/'), pathToFound = '', pathsToFound = [], parentDirIndexScriptModule = null;
        pathExploded.forEach(function (item) {
            pathToFound += '/' + item;
            pathsToFound.push(pathToFound);
        });
        pathsToFound.reverse();
        parentDirIndexScriptModule = this.cache.TryToFindParentDirectoryIndexScriptModule(pathsToFound);
        if (parentDirIndexScriptModule != null) {
            if (!this.development) {
                this.directoriesHandler.HandleIndexScript(parentDirIndexScriptModule.fullPath, parentDirIndexScriptModule.scriptName, parentDirIndexScriptModule.modTime, req, res, cb);
            }
            else {
                fs_1.default.stat(parentDirIndexScriptModule.fullPath, function (err, stats) {
                    if (err) {
                        console.error(err);
                        return cb();
                    }
                    _this.directoriesHandler.HandleIndexScript(parentDirIndexScriptModule.fullPath, parentDirIndexScriptModule.scriptName, stats.mtime.getTime(), req, res, cb);
                });
            }
        }
        else {
            this.handleReqNonExistPath(pathsToFound, 0, function (newFullPath, lastFoundPathStats, lastFoundPath) {
                fs_1.default.readdir(newFullPath, function (err, dirItems) {
                    if (err != null) {
                        _this.errorsHandler.PrintError(err, req, res, 403);
                        return cb();
                    }
                    _this.directoriesHandler.HandleDirectory(404, lastFoundPathStats, lastFoundPath, newFullPath, req, res, cb, dirItems);
                });
            }, function (err) {
                var error = null;
                try {
                    throw new Error("Path not found: `" + path + "`.");
                }
                catch (e) {
                    error = e;
                }
                _this.errorsHandler.PrintError(error, req, res, 404);
                return cb();
            });
        }
    };
    /**
     * @summary Try to get file system directory stats - recursively on first existing parent directory.
     */
    Server.prototype.handleReqNonExistPath = function (pathsToFound, index, successCallback, errorCallback) {
        var _this = this;
        var pathToFound = pathsToFound[index];
        var lastFoundPathLocal = helpers_1.Helpers.TrimLeft(pathToFound, '/');
        fs_1.default.stat(this.documentRoot + pathToFound, function (err, lastFoundPathStats) {
            if (err == null) {
                var newFullPath = helpers_1.Helpers.TrimRight(_this.documentRoot + '/' + lastFoundPathLocal, '/');
                newFullPath = decodeURIComponent(newFullPath);
                successCallback(newFullPath, lastFoundPathStats, lastFoundPathLocal);
            }
            else {
                index += 1;
                if (index == pathsToFound.length) {
                    errorCallback(err);
                }
                else {
                    _this.handleReqNonExistPath(pathsToFound, index, successCallback, errorCallback);
                }
            }
        });
    };
    Server.VERSION = '2.0.1';
    Server.DEFAULTS = {
        PORT: 8000,
        DOMAIN: '127.0.0.1',
        RESPONSES: default_responses_1.DefaultResponses
    };
    Server.SESSION = {
        HASH: "35$%d9wZfw256SAsMGá/@#$%&",
        ID_MAX_AGE: 3600 // hour
    };
    Server.INDEX = {
        SCRIPTS: ['index.js'],
        FILES: ['index.html', 'index.htm', 'default.html', 'default.htm']
    };
    Server.FILE_SIZE = {
        THRESH: 1000,
        UNITS: ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    };
    return Server;
}());
exports.Server = Server;
//# sourceMappingURL=server.js.map