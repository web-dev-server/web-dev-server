Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs_1 = tslib_1.__importDefault(require("fs"));
var path_1 = tslib_1.__importDefault(require("path"));
var server_1 = require("./server");
var helpers_1 = require("./helpers");
var DirectoriesHandler = /** @class */ (function () {
    function DirectoriesHandler(server, cache, filesHandler, errorsHandler) {
        this.indexFiles = new Map();
        this.indexScripts = new Map();
        this.server = server;
        this.cache = cache;
        this.filesHandler = filesHandler;
        this.errorsHandler = errorsHandler;
        var scripts = server_1.Server.INDEX.SCRIPTS, files = server_1.Server.INDEX.FILES, i, l;
        for (i = 0, l = scripts.length; i < l; i++)
            this.indexScripts.set(scripts[i], i);
        for (i = 0, l = files.length; i < l; i++)
            this.indexFiles.set(files[i], i);
    }
    /**
     * @summary Display directory content or send index.html file:
     */
    DirectoriesHandler.prototype.HandleDirectory = function (statusCode, dirStats, path, fullPath, req, res, cb, dirItems) {
        var _this = this;
        var indexScriptsAndFiles = helpers_1.Helpers.FindIndexInDirectory(dirItems, this.indexScripts, this.indexFiles);
        if (indexScriptsAndFiles.scripts.length > 0) {
            // try to get stat about any index script handler
            this.indexScriptOrFileStats(fullPath, indexScriptsAndFiles.scripts, 0, function (indexScript, indexScriptStat) {
                // index script handler
                _this.HandleIndexScript(fullPath, indexScript, indexScriptStat.mtime.getTime(), req, res, cb);
            }, function () {
                if (indexScriptsAndFiles.files.length > 0) {
                    // try to get stat about any index file handler
                    _this.indexScriptOrFileStats(fullPath, indexScriptsAndFiles.files, 0, function (indexFile, indexFileStat) {
                        // index file handler
                        _this.filesHandler.HandleFile(indexFileStat, path + '/' + indexFile, fullPath + '/' + indexFile, req, res, cb);
                    }, function () {
                        if (!_this.server.IsDevelopment()) {
                            _this.HandleForbidden(res, cb);
                        }
                        else {
                            // directory handler
                            _this.renderDirContent(statusCode, dirStats, dirItems, path, fullPath, res, cb);
                        }
                    });
                }
                else {
                    if (!_this.server.IsDevelopment()) {
                        _this.HandleForbidden(res, cb);
                    }
                    else {
                        // directory handler
                        _this.renderDirContent(statusCode, dirStats, dirItems, path, fullPath, res, cb);
                    }
                }
            });
        }
        else if (indexScriptsAndFiles.files.length > 0) {
            this.indexScriptOrFileStats(fullPath, indexScriptsAndFiles.files, 0, function (indexFile, indexFileStat) {
                // index file handler
                _this.filesHandler.HandleFile(indexFileStat, path + '/' + indexFile, fullPath + '/' + indexFile, req, res, cb);
            }, function () {
                if (!_this.server.IsDevelopment()) {
                    _this.HandleForbidden(res, cb);
                }
                else {
                    // directory handler
                    _this.renderDirContent(statusCode, dirStats, dirItems, path, fullPath, res, cb);
                }
            });
        }
        else {
            if (!this.server.IsDevelopment()) {
                this.HandleForbidden(res, cb);
            }
            else {
                // directory handler
                this.renderDirContent(statusCode, dirStats, dirItems, path, fullPath, res, cb);
            }
        }
    };
    /**
     * @summary Process any application in index.js in directory request or on non-existing path request:
     */
    DirectoriesHandler.prototype.HandleIndexScript = function (fullPath, indexScript, indexScriptModTime, req, res, cb) {
        var _this = this;
        (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var cachedModule, moduleInstance, requireCacheKey, e_1, e_2, e_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cachedModule = this.cache.GetIndexScriptModuleRecord(fullPath);
                        if (!(cachedModule !== null)) return [3 /*break*/, 9];
                        if (!this.server.IsDevelopment()) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        requireCacheKey = path_1.default.resolve(fullPath + '/' + indexScript);
                        moduleInstance = cachedModule.instance;
                        if (indexScriptModTime > cachedModule.modTime ||
                            !require.cache[requireCacheKey]) {
                            this.cache.ClearModuleInstanceCacheAndRequireCache(fullPath);
                            moduleInstance = this.indexScriptModuleCreate(fullPath, indexScript, indexScriptModTime, req, res);
                        }
                        else {
                            moduleInstance = cachedModule.instance;
                        }
                        return [4 /*yield*/, this.indexScriptModuleExecute(fullPath, indexScript, moduleInstance, req, res)];
                    case 2:
                        _a.sent();
                        cb();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        this.errorsHandler.PrintError(e_1, req, res, 500);
                        this.cache.ClearModuleInstanceCacheAndRequireCache(fullPath);
                        cb();
                        return [3 /*break*/, 4];
                    case 4: return [3 /*break*/, 8];
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        moduleInstance = cachedModule.instance;
                        return [4 /*yield*/, this.indexScriptModuleExecute(fullPath, indexScript, moduleInstance, req, res)];
                    case 6:
                        _a.sent();
                        cb();
                        return [3 /*break*/, 8];
                    case 7:
                        e_2 = _a.sent();
                        this.errorsHandler.PrintError(e_2, req, res, 500);
                        this.cache.ClearModuleInstanceCacheAndRequireCache(fullPath);
                        cb();
                        return [3 /*break*/, 8];
                    case 8: return [3 /*break*/, 12];
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        moduleInstance = this.indexScriptModuleCreate(fullPath, indexScript, indexScriptModTime, req, res);
                        return [4 /*yield*/, this.indexScriptModuleExecute(fullPath, indexScript, moduleInstance, req, res)];
                    case 10:
                        _a.sent();
                        cb();
                        return [3 /*break*/, 12];
                    case 11:
                        e_3 = _a.sent();
                        this.errorsHandler.PrintError(e_3, req, res, 500);
                        this.cache.ClearModuleInstanceCacheAndRequireCache(fullPath);
                        cb();
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        }); })();
    };
    /**
     * @summary Render and send 403 forbidden page - do not list directory content:
     */
    DirectoriesHandler.prototype.HandleForbidden = function (res, cb) {
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.writeHead(403);
        }
        if (!res.finished) {
            var outputStr = server_1.Server.DEFAULTS.RESPONSES.CODES.HTML
                .replace('%head%', server_1.Server.DEFAULTS.RESPONSES.CODES.HEAD_NOT_ALLOWED)
                .replace('%icon%', '')
                .replace('%body%', server_1.Server.DEFAULTS.RESPONSES.CODES.HEADER_NOT_ALLOWED);
            res.write(outputStr, null, cb);
            res.end();
        }
        else {
            cb();
        }
    };
    /**
     * @summary Get first index script (or index static file) file system stats:
     */
    DirectoriesHandler.prototype.indexScriptOrFileStats = function (fullPath, files, index, successCallback, errorCallback) {
        var _this = this;
        fs_1.default.stat(fullPath + '/' + files[index], function (err, itemStat) {
            if (err == null && itemStat.isFile()) {
                successCallback(files[index], itemStat);
            }
            else {
                index++;
                if (index + 1 > files.length) {
                    errorCallback();
                }
                else {
                    _this.indexScriptOrFileStats(fullPath, files, index, successCallback, errorCallback);
                }
            }
        });
    };
    /**
     * @summary Create directory index.js script module instance with optional development require cache resolving:
     */
    DirectoriesHandler.prototype.indexScriptModuleCreate = function (fullPath, indexScript, indexScriptModTime, req, res) {
        var appDeclaration;
        if (this.server.IsDevelopment()) {
            var cacheKeysBeforeRequire = Object.keys(require.cache);
            appDeclaration = this.indexScriptModuleGetDeclaration(fullPath + '/' + indexScript);
            var cacheKeysAfterRequire = Object.keys(require.cache);
            if (cacheKeysBeforeRequire.length != cacheKeysAfterRequire.length) {
                var cacheKeysToWatch = helpers_1.Helpers.GetRequireCacheDifferenceKeys(cacheKeysBeforeRequire, cacheKeysAfterRequire, fullPath + '/' + indexScript, fullPath + '/node_modules/');
                //console.log("declaration keys loaded: ", cacheKeysToWatch);
                this.cache.InitRequireCacheItemsWatchHandlers(fullPath + '/' + indexScript, cacheKeysToWatch);
            }
        }
        else {
            appDeclaration = this.indexScriptModuleGetDeclaration(fullPath + '/' + indexScript);
        }
        var appInstance = new appDeclaration(this.server.GetHttpServer(), this.server.GetExpressApp(), this.server.GetExpressSessionParser(), req, res);
        this.cache.SetNewIndexScriptModuleRecord(appInstance, indexScriptModTime, indexScript, fullPath);
        return appInstance;
    };
    /**
     * @summary Create directory index.js script module instance with optional development require cache resolving:
     */
    DirectoriesHandler.prototype.indexScriptModuleGetDeclaration = function (modulefullPath) {
        var appDeclaration = null;
        var handleMethodName = 'handleHttpRequest';
        var module = require(modulefullPath);
        if (module && module.prototype && handleMethodName in module.prototype) {
            appDeclaration = module;
        }
        else if (module && module.__esModule) {
            var moduleKeys = Object.keys(module);
            if (moduleKeys.indexOf('default') != -1 &&
                module.default &&
                module.default.prototype &&
                handleMethodName in module.default.prototype) {
                appDeclaration = module.default;
            }
            else {
                var moduleKey, moduleItem;
                for (var i = 0, l = moduleKeys.length; i < l; i++) {
                    moduleKey = moduleKeys[i];
                    moduleItem = module[moduleKey];
                    if (moduleItem &&
                        moduleItem.prototype &&
                        handleMethodName in moduleItem) {
                        appDeclaration = moduleItem;
                        break;
                    }
                }
            }
        }
        if (appDeclaration === null)
            throw new Error("Cannot find `IAplication` declaration in directory index script: `" + modulefullPath + "`.");
        return appDeclaration;
    };
    /**
     * @summary Process directory index.js script http request handler with optional development require cache resolving:
     */
    DirectoriesHandler.prototype.indexScriptModuleExecute = function (fullPath, indexScript, appInstance, req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var cacheKeysBeforeRequire, cacheKeysAfterRequire, cacheKeysToWatch;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.server.IsDevelopment()) return [3 /*break*/, 2];
                        cacheKeysBeforeRequire = Object.keys(require.cache);
                        return [4 /*yield*/, appInstance.handleHttpRequest(req, res)];
                    case 1:
                        _a.sent();
                        cacheKeysAfterRequire = Object.keys(require.cache);
                        if (cacheKeysBeforeRequire.length != cacheKeysAfterRequire.length) {
                            cacheKeysToWatch = helpers_1.Helpers.GetRequireCacheDifferenceKeys(cacheKeysBeforeRequire, cacheKeysAfterRequire, fullPath + '/' + indexScript, fullPath + '/node_modules/');
                            //console.log("handler keys loaded: ", cacheKeysToWatch);
                            this.cache.InitRequireCacheItemsWatchHandlers(fullPath + '/' + indexScript, cacheKeysToWatch);
                        }
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, appInstance.handleHttpRequest(req, res)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @summary Go through all files and folders in current directory:
     */
    DirectoriesHandler.prototype.renderDirContent = function (statusCode, dirStats, dirItemsNames, reqRelPath, fullPath, res, cb) {
        var _this = this;
        var promises = [], dirRows = [], fileRows = [];
        reqRelPath = helpers_1.Helpers.Trim(reqRelPath, '/');
        dirItemsNames.forEach(function (dirItemName, index) {
            promises.push(new Promise(function (resolve, reject) {
                fs_1.default.stat(fullPath + '/' + dirItemName, function (err, itemStats) {
                    if (err != null)
                        return reject(err);
                    _this.renderDirContentRowStats(reqRelPath, dirItemName, itemStats, dirRows, fileRows, resolve);
                });
            }));
        });
        Promise.all(promises).then(function () {
            _this.handleDirContentRows(statusCode, reqRelPath, fullPath, dirStats, dirRows, fileRows, res, cb);
        });
    };
    DirectoriesHandler.prototype.renderDirContentRowStats = function (reqRelPath, dirItemName, itemStats, dirRows, fileRows, resolve) {
        if (itemStats.isDirectory()) {
            dirRows.push(new helpers_1.DirItem(itemStats.isSymbolicLink()
                ? helpers_1.DirItem.TYPE_DIR | helpers_1.DirItem.TYPE_SYMLINK
                : helpers_1.DirItem.TYPE_DIR, dirItemName, this.renderDirContentDirRow(reqRelPath, dirItemName, itemStats)));
        }
        else {
            var dirItemType;
            if (itemStats.isFile()) {
                dirItemType = itemStats.isSymbolicLink()
                    ? helpers_1.DirItem.TYPE_FILE | helpers_1.DirItem.TYPE_SYMLINK
                    : helpers_1.DirItem.TYPE_FILE;
            }
            else if (itemStats.isBlockDevice()) {
                dirItemType = helpers_1.DirItem.TYPE_BLOCK_DEVICE;
            }
            else if (itemStats.isCharacterDevice()) {
                dirItemType = helpers_1.DirItem.TYPE_CHARACTER_DEVICE;
            }
            else if (itemStats.isSocket()) {
                dirItemType = helpers_1.DirItem.TYPE_SOCKET;
            }
            else if (itemStats.isFIFO()) {
                dirItemType = helpers_1.DirItem.TYPE_FIFO;
            }
            fileRows.push(new helpers_1.DirItem(dirItemType, dirItemName, this.renderDirContentFileRow(reqRelPath, dirItemName, itemStats)));
        }
        resolve();
    };
    /**
     * @summary Display directory content - complete directory row code for directory content:
     */
    DirectoriesHandler.prototype.renderDirContentDirRow = function (reqRelPath, dirItemName, itemStats) {
        var baseUrl = this.server.GetBaseUrl();
        var hrefParts = [];
        if (baseUrl)
            hrefParts.push(baseUrl);
        if (reqRelPath)
            hrefParts.push(reqRelPath);
        hrefParts.push(helpers_1.Helpers.Trim(dirItemName, '/'));
        return server_1.Server.DEFAULTS.RESPONSES.CODES.DIR_ROW
            .replace('%href%', '/' + hrefParts.join('/') + '/')
            .replace('%path%', helpers_1.Helpers.HtmlEntitiesEncode(dirItemName))
            .replace('%date%', helpers_1.Helpers.FormatDate(itemStats.mtime));
    };
    /**
     * @summary Display directory content - complete file row code for directory content:
     */
    DirectoriesHandler.prototype.renderDirContentFileRow = function (reqRelPath, fileItemName, itemStats) {
        if (itemStats === void 0) { itemStats = null; }
        var date, size = 0, baseUrl = this.server.GetBaseUrl();
        if (itemStats) {
            date = itemStats.mtime;
            size = itemStats.size;
        }
        else {
            date = new Date();
            date.setTime(0);
        }
        var hrefParts = [];
        if (baseUrl)
            hrefParts.push(baseUrl);
        if (reqRelPath)
            hrefParts.push(reqRelPath);
        hrefParts.push(helpers_1.Helpers.Trim(fileItemName, '/'));
        return server_1.Server.DEFAULTS.RESPONSES.CODES.FILE_ROW
            .replace('%href%', '/' + hrefParts.join('/'))
            .replace('%path%', helpers_1.Helpers.HtmlEntitiesEncode(fileItemName))
            .replace('%filesize%', helpers_1.Helpers.FormatFileSize(size))
            .replace('%date%', helpers_1.Helpers.FormatDate(date));
    };
    /**
     * @summary Display directory content - send directory content html code:
     */
    DirectoriesHandler.prototype.handleDirContentRows = function (statusCode, path, fullPath, dirStats, dirRows, fileRows, res, cb) {
        var headerCode = '', listCode = '', outputStr = '';
        dirRows.sort(helpers_1.Helpers.ObjectsArraySortByPathProperty);
        fileRows.sort(helpers_1.Helpers.ObjectsArraySortByPathProperty);
        if (statusCode == 200) {
            headerCode = this.handleDirReqCompleteHeader(path, fullPath, dirStats);
            if (path) {
                dirRows.unshift(new helpers_1.DirItem(helpers_1.DirItem.TYPE_DIR, '..', this.renderDirContentDirRow(path, '..', dirStats)));
            }
            dirRows.forEach(function (item) {
                listCode += item.code;
            });
            fileRows.forEach(function (item) {
                listCode += item.code;
            });
            outputStr = server_1.Server.DEFAULTS.RESPONSES.CODES.HTML
                .replace('%head%', server_1.Server.DEFAULTS.RESPONSES.CODES.HEAD_FOUND.replace('%fullPath%', fullPath))
                .replace('%icon%', server_1.Server.DEFAULTS.RESPONSES.ICONS.FAVICON)
                .replace('%body%', headerCode + server_1.Server.DEFAULTS.RESPONSES.CODES.LIST.replace('%tbody%', listCode));
        }
        else /*if (statusCode == 403)*/ {
            outputStr = server_1.Server.DEFAULTS.RESPONSES.CODES.HTML
                .replace('%head%', server_1.Server.DEFAULTS.RESPONSES.CODES.HEAD_NOT_ALLOWED)
                .replace('%icon%', server_1.Server.DEFAULTS.RESPONSES.ICONS.FAVICON)
                .replace('%body%', server_1.Server.DEFAULTS.RESPONSES.CODES.HEADER_NOT_ALLOWED);
        }
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.writeHead(statusCode);
        }
        if (!res.finished) {
            res.write(outputStr, null, cb);
            res.end();
        }
        else {
            cb();
        }
    };
    /**
     * @summary Display directory content - complete heading code for directory content:
     */
    DirectoriesHandler.prototype.handleDirReqCompleteHeader = function (path, fullPath, dirStats) {
        var headerCode = '', pathStep = '', pathCodes = [], pathExploded = path.split('/'), portStr = this.server.GetPort().toString(), domain = this.server.GetDomain();
        if (pathExploded[0] != '') {
            for (var i = 0, l = pathExploded.length; i < l; i++) {
                pathStep += ((i > 0) ? '/' : '') + pathExploded[i];
                pathCodes.push('<a href="/' +
                    helpers_1.Helpers.HtmlEntitiesEncode(pathStep) +
                    '/">' + pathExploded[i] + '/</a> ');
            }
        }
        else {
            pathCodes = [path];
        }
        headerCode = server_1.Server.DEFAULTS.RESPONSES.CODES.HEADER_FOUND
            .replace('%domain%', helpers_1.Helpers.HtmlEntitiesEncode(domain))
            .replace('%port%', portStr)
            .replace('%path%', pathCodes.join(''))
            .replace('%fullPath%', fullPath)
            .replace('%lastMod%', helpers_1.Helpers.FormatDate(dirStats.mtime));
        return headerCode;
    };
    return DirectoriesHandler;
}());
exports.DirectoriesHandler = DirectoriesHandler;
//# sourceMappingURL=directories-handler.js.map