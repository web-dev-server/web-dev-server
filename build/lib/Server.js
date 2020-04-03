Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var http_1 = require("http");
var fs_1 = require("fs");
var path_1 = require("path");
var url_1 = require("url");
var StringHelper_1 = require("./Tools/Helpers/StringHelper");
var Defaults_1 = require("./Handlers/Defaults");
var Cache_1 = require("./Applications/Cache");
var Error_1 = require("./Handlers/Error");
var File_1 = require("./Handlers/File");
var Directory_1 = require("./Handlers/Directory");
var Event_1 = require("./Event");
var Request_1 = require("./Request");
var Response_1 = require("./Response");
tslib_1.__exportStar(require("./Request"), exports);
tslib_1.__exportStar(require("./Response"), exports);
tslib_1.__exportStar(require("./Event"), exports);
tslib_1.__exportStar(require("./Tools/Namespace"), exports);
tslib_1.__exportStar(require("./Applications/Namespace"), exports);
var Server = /** @class */ (function () {
    function Server() {
        this.documentRoot = null;
        this.basePath = null;
        this.port = null;
        this.hostName = null;
        this.development = true;
        this.httpServer = null;
        this.customServerHandler = null;
        this.cache = null;
        this.errorsHandler = null;
        this.filesHandler = null;
        this.directoriesHandler = null;
        this.customErrorHandler = null;
        this.customHttpPreHandlers = [];
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
     * @param hostname Server ip or domain to listening on.
     */
    Server.prototype.SetHostname = function (hostname) {
        this.hostName = hostname;
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
        this.documentRoot = StringHelper_1.StringHelper.TrimRight(path_1.resolve(dirname).replace(/\\/g, '/'), '/');
        return this;
    };
    /**
     * @summary Set http server base path, not required
     * @param basePath Base path (proxy path, if you are running the server under proxy).
     */
    Server.prototype.SetBasePath = function (basePath) {
        this.basePath = StringHelper_1.StringHelper.Trim(basePath.replace(/\\/g, '/'), '/');
        return this;
    };
    Server.prototype.SetServerHandler = function (httpHandler) {
        this.customServerHandler = httpHandler;
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
    Server.prototype.AddPreHandler = function (handler) {
        this.customHttpPreHandlers.push(handler);
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
    Server.prototype.GetHostname = function () {
        return this.hostName;
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
    Server.prototype.GetBasePath = function () {
        return this.basePath;
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
     * @summary Try to find cached record by server document root and requested path
     * 			and return directory full path from the cache record.
     * @param rawRequestUrl Raw requested path.
     */
    Server.prototype.TryToFindIndexPath = function (rawRequestUrl) {
        var result = [];
        var qmPos = rawRequestUrl.indexOf('?');
        if (qmPos !== -1)
            rawRequestUrl = rawRequestUrl.substr(0, qmPos);
        var searchingRequestPaths = this.getSearchingRequestPaths(rawRequestUrl);
        var parentDirIndexScriptModule = this.cache
            .TryToFindParentDirectoryIndexScriptModule(searchingRequestPaths);
        if (parentDirIndexScriptModule !== null)
            result = [
                parentDirIndexScriptModule.dirFullPath,
                parentDirIndexScriptModule.scriptName
            ];
        return result;
    };
    /**
     * @summary Start HTTP server
     */
    Server.prototype.Run = function (callback) {
        var _this = this;
        if (callback === void 0) { callback = null; }
        this.documentRoot = path_1.resolve(this.documentRoot || __dirname).replace(/\\/g, '/');
        this.port = this.port || Server.DEFAULTS.PORT;
        this.hostName = this.hostName || Server.DEFAULTS.DOMAIN;
        this.cache = new Cache_1.Cache(this);
        this.errorsHandler = new Error_1.ErrorsHandler(this, this.cache);
        this.filesHandler = new File_1.FilesHandler(this.errorsHandler);
        this.directoriesHandler = new Directory_1.DirectoriesHandler(this, this.cache, this.filesHandler, this.errorsHandler);
        var serverOptions = {
            // @ts-ignore
            IncomingMessage: Request_1.Request,
            // @ts-ignore
            ServerResponse: Response_1.Response
        };
        if (this.customServerHandler !== null) {
            this.httpServer = http_1.createServer(serverOptions, this.customServerHandler);
        }
        else {
            this.httpServer = http_1.createServer(serverOptions);
        }
        this.httpServer.on('request', function (req, res) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.handleReq(req, res)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        this.httpServer.on('error', function (err) {
            if (!callback) {
                console.error(err);
            }
            else {
                callback(false, err);
                callback = null;
            }
        });
        this.httpServer['__wds'] = this;
        this.httpServer.listen(this.port, this.hostName, function () {
            if (!callback) {
                console.info("HTTP server has been started at: 'http://" + _this.hostName + ":"
                    + _this.port.toString() + "' to serve directory: \n'" + _this.documentRoot
                    + "'.\nEnjoy browsing:-) To stop the server, pres CTRL + C or close this command line window.");
            }
            else {
                callback(true, null);
                callback = null;
            }
        });
        return this;
    };
    /**
     * @summary Handle all HTTP requests
     */
    Server.prototype.handleReq = function (req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var httpReq, requestPath, qmPos, pathAllowed, fullPathVirtual;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                httpReq = req;
                requestPath = '/' + StringHelper_1.StringHelper.Trim(url_1.parse(httpReq.url).pathname, '/');
                qmPos = requestPath.indexOf('?');
                if (qmPos !== -1)
                    requestPath = requestPath.substr(0, qmPos);
                pathAllowed = this.isPathAllowed('/' + requestPath);
                if (!pathAllowed) {
                    return [2 /*return*/, this.directoriesHandler.HandleForbidden(res)];
                }
                fullPathVirtual = path_1.resolve(this.documentRoot + requestPath).replace(/\\/g, '/');
                fullPathVirtual = StringHelper_1.StringHelper.TrimRight(fullPathVirtual, '/');
                if (this.development)
                    this.errorsHandler.SetHandledRequestProperties(req, res);
                (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var event, preHandler, i, l, err_1, err, stats;
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!(this.customHttpPreHandlers.length > 0)) return [3 /*break*/, 8];
                                event = new Event_1.Event(req, res, fullPathVirtual);
                                i = 0, l = this.customHttpPreHandlers.length;
                                _a.label = 1;
                            case 1:
                                if (!(i < l)) return [3 /*break*/, 7];
                                preHandler = this.customHttpPreHandlers[i];
                                _a.label = 2;
                            case 2:
                                _a.trys.push([2, 4, , 5]);
                                return [4 /*yield*/, preHandler.call(null, req, res, event)];
                            case 3:
                                _a.sent();
                                return [3 /*break*/, 5];
                            case 4:
                                err_1 = _a.sent();
                                this.errorsHandler.PrintError(err_1, req, res, 500);
                                event.PreventDefault();
                                return [3 /*break*/, 5];
                            case 5:
                                if (event.IsPreventDefault())
                                    return [3 /*break*/, 7];
                                _a.label = 6;
                            case 6:
                                i++;
                                return [3 /*break*/, 1];
                            case 7:
                                if (event.IsPreventDefault())
                                    return [2 /*return*/];
                                _a.label = 8;
                            case 8:
                                err = null;
                                return [4 /*yield*/, new Promise(function (resolve, reject) {
                                        fs_1.stat(fullPathVirtual, function (errLocal, stats) {
                                            if (errLocal)
                                                err = errLocal;
                                            resolve(stats);
                                        });
                                    })];
                            case 9:
                                stats = _a.sent();
                                if (stats) {
                                    this.handleReqExistingPath(fullPathVirtual, requestPath, stats, req, res);
                                }
                                else if (err && err.code == 'ENOENT') {
                                    this.handleReqNonExistingPath(requestPath, req, res);
                                }
                                else {
                                    this.errorsHandler.PrintError(err);
                                }
                                return [2 /*return*/];
                        }
                    });
                }); })();
                return [2 /*return*/];
            });
        });
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
     * @summary Process request content found
     */
    Server.prototype.handleReqExistingPath = function (fullPath, requestPath, stats, req, res) {
        var _this = this;
        if (stats.isDirectory()) {
            var httpReq = req;
            var originalPathname = url_1.parse(httpReq.url, false).pathname;
            if (originalPathname.charAt(originalPathname.length - 1) !== '/') {
                res.Redirect(originalPathname + '/', 301, "Correcting directory request", true);
            }
            else {
                fs_1.readdir(fullPath, function (err, dirItems) {
                    if (err != null)
                        return _this.errorsHandler.PrintError(err, req, res, 403);
                    _this.directoriesHandler.HandleDirectory(fullPath, requestPath, stats, dirItems, 200, req, res);
                });
            }
        }
        else if (stats.isFile()) {
            var dirFullPath, fileName, lastSlashPos;
            fullPath = StringHelper_1.StringHelper.TrimRight(fullPath, '/');
            lastSlashPos = fullPath.lastIndexOf('/');
            if (lastSlashPos !== -1) {
                fileName = fullPath.substr(lastSlashPos + 1);
                dirFullPath = fullPath.substr(0, lastSlashPos);
            }
            else {
                fileName = fullPath;
                dirFullPath = '';
            }
            if (Server.INDEX.SCRIPTS.indexOf(fileName) != -1) {
                this.directoriesHandler.HandleIndexScript(dirFullPath, fileName, stats.mtime.getTime(), req, res);
            }
            else {
                this.filesHandler.HandleFile(fullPath, fileName, stats, res);
            }
        } /* else (
            stats.isBlockDevice() ||
            stats.isCharacterDevice() ||
            stats.isSymbolicLink() ||
            stats.isFIFO() ||
            stats.isSocket()
        ) {
            cb();
        }*/
    };
    /**
     * @summary Display error 500/404 (and try to list first existing parent folder content):
     */
    Server.prototype.handleReqNonExistingPath = function (requestPath, req, res) {
        var _this = this;
        var searchingRequestPaths = this.getSearchingRequestPaths(requestPath);
        var parentDirIndexScriptModule = this.cache
            .TryToFindParentDirectoryIndexScriptModule(searchingRequestPaths);
        if (parentDirIndexScriptModule != null) {
            if (!this.development) {
                this.directoriesHandler.HandleIndexScript(parentDirIndexScriptModule.dirFullPath, parentDirIndexScriptModule.scriptName, parentDirIndexScriptModule.modTime, req, res);
            }
            else {
                fs_1.stat(parentDirIndexScriptModule.dirFullPath, function (err, stats) {
                    if (err) {
                        return console.error(err);
                    }
                    _this.directoriesHandler.HandleIndexScript(parentDirIndexScriptModule.dirFullPath, parentDirIndexScriptModule.scriptName, stats.mtime.getTime(), req, res);
                });
            }
        }
        else {
            this.handleReqNonExistPath(searchingRequestPaths, 0, function (newFullPath, newRequestPath, foundParentDirStats) {
                fs_1.readdir(newFullPath, function (err, dirItems) {
                    if (err != null)
                        return _this.errorsHandler.PrintError(err, req, res, 403);
                    _this.directoriesHandler.HandleDirectory(newFullPath, newRequestPath, foundParentDirStats, dirItems, 404, req, res);
                });
            }, function (err) {
                var error = null;
                try {
                    throw new Error("Path not found: `" + requestPath + "`.");
                }
                catch (e) {
                    error = e;
                }
                _this.errorsHandler.PrintError(error, req, res, 404);
            });
        }
    };
    /**
     * @summary Try to get file system directory stats - recursively on first existing parent directory.
     */
    Server.prototype.handleReqNonExistPath = function (pathsToFound, index, successCallback, errorCallback) {
        var _this = this;
        var pathToFound = pathsToFound[index];
        var newRequestPath = StringHelper_1.StringHelper.TrimLeft(pathToFound, '/');
        fs_1.stat(this.documentRoot + pathToFound, function (err, dirStats) {
            if (err == null) {
                var newFullPath = StringHelper_1.StringHelper.TrimRight(_this.documentRoot + '/' + newRequestPath, '/');
                successCallback(newFullPath, newRequestPath, dirStats);
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
    Server.prototype.getSearchingRequestPaths = function (requestPath) {
        var pathExploded = StringHelper_1.StringHelper.Trim(requestPath, '/').split('/'), searchingRequestPath = '', searchingRequestPaths = [];
        pathExploded.forEach(function (item) {
            searchingRequestPath += '/' + item;
            searchingRequestPaths.push(searchingRequestPath);
        });
        searchingRequestPaths.reverse();
        if (searchingRequestPaths.length === 1 && searchingRequestPaths[0] != '/')
            searchingRequestPaths.push('/');
        return searchingRequestPaths;
    };
    Server.VERSION = '2.2.0';
    Server.DEFAULTS = {
        PORT: 8000,
        DOMAIN: '127.0.0.1',
        RESPONSES: Defaults_1.Defaults
    };
    Server.SESSION = {
        HASH: "35$%d9wZfw256SAsMGá/@#$%&",
        ID_MAX_AGE: 3600 // hour
    };
    Server.INDEX = {
        SCRIPTS: ['index.js'],
        FILES: ['index.html', 'index.htm', 'default.html', 'default.htm']
    };
    return Server;
}());
exports.Server = Server;
//# sourceMappingURL=Server.js.map