Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs_1 = require("fs");
var path_1 = require("path");
var Server_1 = require("../Server");
var DirItem_1 = require("./Directories/DirItem");
var StringHelper_1 = require("../Tools/Helpers/StringHelper");
var NumberHelper_1 = require("../Tools/Helpers/NumberHelper");
var DateHelper_1 = require("../Tools/Helpers/DateHelper");
var Cache_1 = require("../Applications/Cache");
var DirectoriesHandler = /** @class */ (function () {
    function DirectoriesHandler(server, cache, filesHandler, errorsHandler) {
        this.indexFiles = new Map();
        this.indexScripts = new Map();
        this.server = server;
        this.cache = cache;
        this.filesHandler = filesHandler;
        this.errorsHandler = errorsHandler;
        var scripts = Server_1.Server.INDEX.SCRIPTS, files = Server_1.Server.INDEX.FILES, i, l;
        for (i = 0, l = scripts.length; i < l; i++)
            this.indexScripts.set(scripts[i], i);
        for (i = 0, l = files.length; i < l; i++)
            this.indexFiles.set(files[i], i);
    }
    /**
     * @summary Display directory content or send index.html file:
     */
    DirectoriesHandler.prototype.HandleDirectory = function (fullPath, requestPath, dirStats, dirItems, statusCode, req, res) {
        var _this = this;
        var indexScriptsAndFiles = DirItem_1.DirItem.FindIndex(dirItems, this.indexScripts, this.indexFiles);
        if (indexScriptsAndFiles.scripts.length > 0) {
            // try to get stat about any index script handler
            this.indexScriptOrFileStats(fullPath, indexScriptsAndFiles.scripts, 0, function (indexFullPath, indexScript, indexScriptStat) {
                // index script handler
                _this.HandleIndexScript(fullPath, indexScript, indexScriptStat.mtime.getTime(), req, res);
            }, function () {
                if (indexScriptsAndFiles.files.length > 0) {
                    // try to get stat about any index file handler
                    _this.indexScriptOrFileStats(fullPath, indexScriptsAndFiles.files, 0, function (indexFullPath, indexFile, indexFileStat) {
                        // index file handler
                        _this.filesHandler.HandleFile(indexFullPath, indexFile, indexFileStat, res);
                    }, function () {
                        if (!_this.server.IsDevelopment()) {
                            _this.HandleForbidden(res);
                        }
                        else {
                            // directory handler
                            _this.renderDirContent(statusCode, dirStats, dirItems, requestPath, fullPath, res);
                        }
                    });
                }
                else {
                    if (!_this.server.IsDevelopment()) {
                        _this.HandleForbidden(res);
                    }
                    else {
                        // directory handler
                        _this.renderDirContent(statusCode, dirStats, dirItems, requestPath, fullPath, res);
                    }
                }
            });
        }
        else if (indexScriptsAndFiles.files.length > 0) {
            this.indexScriptOrFileStats(fullPath, indexScriptsAndFiles.files, 0, function (indexFullPath, indexFile, indexFileStat) {
                // index file handler
                _this.filesHandler.HandleFile(indexFullPath, indexFile, indexFileStat, res);
            }, function () {
                if (!_this.server.IsDevelopment()) {
                    _this.HandleForbidden(res);
                }
                else {
                    // directory handler
                    _this.renderDirContent(statusCode, dirStats, dirItems, requestPath, fullPath, res);
                }
            });
        }
        else {
            if (!this.server.IsDevelopment()) {
                this.HandleForbidden(res);
            }
            else {
                // directory handler
                this.renderDirContent(200, dirStats, dirItems, requestPath, fullPath, res);
            }
        }
    };
    /**
     * @summary Process any application in index.js in directory request or on non-existing path request:
     */
    DirectoriesHandler.prototype.HandleIndexScript = function (dirFullPath, indexScript, indexScriptModTime, req, res) {
        var _this = this;
        (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var cachedModule, moduleInstance, requireCacheKey, e_1, e_2, e_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cachedModule = this.cache.GetIndexScriptModuleRecord(dirFullPath);
                        // set up request before index script execution:
                        req['setUpIndexScriptExec'](this.server.GetDocumentRoot(), dirFullPath, indexScript, this.server.GetBasePath());
                        if (!(cachedModule !== null)) return [3 /*break*/, 9];
                        if (!this.server.IsDevelopment()) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        requireCacheKey = path_1.resolve(dirFullPath + '/' + indexScript);
                        moduleInstance = cachedModule.instance;
                        if (indexScriptModTime > cachedModule.modTime ||
                            !require.cache[requireCacheKey]) {
                            this.cache.ClearModuleInstanceCacheAndRequireCache(dirFullPath);
                            moduleInstance = this.indexScriptModuleCreate(dirFullPath, indexScript, indexScriptModTime, req, res);
                        }
                        else {
                            moduleInstance = cachedModule.instance;
                        }
                        return [4 /*yield*/, this.indexScriptModuleExecute(dirFullPath, indexScript, moduleInstance, req, res)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        this.errorsHandler.PrintError(e_1, req, res, 500);
                        this.cache.ClearModuleInstanceCacheAndRequireCache(dirFullPath);
                        return [3 /*break*/, 4];
                    case 4: return [3 /*break*/, 8];
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        moduleInstance = cachedModule.instance;
                        return [4 /*yield*/, this.indexScriptModuleExecute(dirFullPath, indexScript, moduleInstance, req, res)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        e_2 = _a.sent();
                        this.errorsHandler.PrintError(e_2, req, res, 500);
                        this.cache.ClearModuleInstanceCacheAndRequireCache(dirFullPath);
                        return [3 /*break*/, 8];
                    case 8: return [3 /*break*/, 12];
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        moduleInstance = this.indexScriptModuleCreate(dirFullPath, indexScript, indexScriptModTime, req, res);
                        return [4 /*yield*/, this.indexScriptModuleExecute(dirFullPath, indexScript, moduleInstance, req, res)];
                    case 10:
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        e_3 = _a.sent();
                        this.errorsHandler.PrintError(e_3, req, res, 500);
                        this.cache.ClearModuleInstanceCacheAndRequireCache(dirFullPath);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        }); })();
    };
    /**
     * @summary Render and send 403 forbidden page - do not list directory content:
     */
    DirectoriesHandler.prototype.HandleForbidden = function (res) {
        var outputStr = Server_1.Server.DEFAULTS.RESPONSES.CODES.HTML
            .replace('%head%', Server_1.Server.DEFAULTS.RESPONSES.CODES.HEAD_NOT_ALLOWED)
            .replace('%icon%', '')
            .replace('%body%', Server_1.Server.DEFAULTS.RESPONSES.CODES.HEADER_NOT_ALLOWED);
        res.SetHeader('Content-Type', 'text/html')
            .SetCode(403)
            .SetEncoding('utf-8')
            .SetBody(outputStr)
            .Send();
    };
    /**
     * @summary Get first index script (or index static file) file system stats:
     */
    DirectoriesHandler.prototype.indexScriptOrFileStats = function (fullPath, files, index, successCallback, errorCallback) {
        var _this = this;
        var indexFullPath = fullPath + '/' + files[index];
        fs_1.stat(indexFullPath, function (err, itemStat) {
            if (err == null && itemStat.isFile()) {
                successCallback(indexFullPath, files[index], itemStat);
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
    DirectoriesHandler.prototype.indexScriptModuleCreate = function (dirFullPath, indexScript, indexScriptModTime, req, res) {
        var appDeclaration;
        if (this.server.IsDevelopment()) {
            var cacheKeysBeforeRequire = Object.keys(require.cache);
            appDeclaration = this.indexScriptModuleGetDeclaration(dirFullPath + '/' + indexScript);
            var cacheKeysAfterRequire = Object.keys(require.cache);
            if (cacheKeysBeforeRequire.length != cacheKeysAfterRequire.length) {
                var cacheKeysToWatch = Cache_1.Cache.GetRequireCacheDifferenceKeys(cacheKeysBeforeRequire, cacheKeysAfterRequire, dirFullPath + '/' + indexScript, dirFullPath + '/node_modules/');
                this.cache.InitRequireCacheItemsWatchHandlers(dirFullPath + '/' + indexScript, cacheKeysToWatch);
            }
        }
        else {
            appDeclaration = this.indexScriptModuleGetDeclaration(dirFullPath + '/' + indexScript);
        }
        var appInstance = new appDeclaration(this.server, req, res);
        this.cache.SetNewIndexScriptModuleRecord(appInstance, indexScriptModTime, indexScript, dirFullPath);
        return appInstance;
    };
    /**
     * @summary Create directory index.js script module instance with optional development require cache resolving:
     */
    DirectoriesHandler.prototype.indexScriptModuleGetDeclaration = function (modulefullPath) {
        var appDeclaration = null;
        var handleMethodName = 'ServerHandler';
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
                        return [4 /*yield*/, appInstance.ServerHandler(req, res)];
                    case 1:
                        _a.sent();
                        cacheKeysAfterRequire = Object.keys(require.cache);
                        if (cacheKeysBeforeRequire.length != cacheKeysAfterRequire.length) {
                            cacheKeysToWatch = Cache_1.Cache.GetRequireCacheDifferenceKeys(cacheKeysBeforeRequire, cacheKeysAfterRequire, fullPath + '/' + indexScript, fullPath + '/node_modules/');
                            this.cache.InitRequireCacheItemsWatchHandlers(fullPath + '/' + indexScript, cacheKeysToWatch);
                        }
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, appInstance.ServerHandler(req, res)];
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
    DirectoriesHandler.prototype.renderDirContent = function (statusCode, dirStats, dirItemsNames, reqRelPath, fullPath, res) {
        var _this = this;
        var promises = [], dirRows = [], fileRows = [];
        reqRelPath = StringHelper_1.StringHelper.Trim(reqRelPath, '/');
        dirItemsNames.forEach(function (dirItemName, index) {
            promises.push(new Promise(function (resolve, reject) {
                fs_1.stat(fullPath + '/' + dirItemName, function (err, itemStats) {
                    if (err != null)
                        return reject(err);
                    _this.renderDirContentRowStats(reqRelPath, dirItemName, itemStats, dirRows, fileRows, resolve);
                });
            }));
        });
        Promise.all(promises).then(function () {
            _this.handleDirContentRows(statusCode, reqRelPath, fullPath, dirStats, dirRows, fileRows, res);
        });
    };
    DirectoriesHandler.prototype.renderDirContentRowStats = function (reqRelPath, dirItemName, itemStats, dirRows, fileRows, resolve) {
        if (itemStats.isDirectory()) {
            dirRows.push(new DirItem_1.DirItem(itemStats.isSymbolicLink()
                ? DirItem_1.DirItem.TYPE_DIR | DirItem_1.DirItem.TYPE_SYMLINK
                : DirItem_1.DirItem.TYPE_DIR, dirItemName, this.renderDirContentDirRow(reqRelPath, dirItemName, itemStats)));
        }
        else {
            var dirItemType;
            if (itemStats.isFile()) {
                dirItemType = itemStats.isSymbolicLink()
                    ? DirItem_1.DirItem.TYPE_FILE | DirItem_1.DirItem.TYPE_SYMLINK
                    : DirItem_1.DirItem.TYPE_FILE;
            }
            else if (itemStats.isBlockDevice()) {
                dirItemType = DirItem_1.DirItem.TYPE_BLOCK_DEVICE;
            }
            else if (itemStats.isCharacterDevice()) {
                dirItemType = DirItem_1.DirItem.TYPE_CHARACTER_DEVICE;
            }
            else if (itemStats.isSocket()) {
                dirItemType = DirItem_1.DirItem.TYPE_SOCKET;
            }
            else if (itemStats.isFIFO()) {
                dirItemType = DirItem_1.DirItem.TYPE_FIFO;
            }
            fileRows.push(new DirItem_1.DirItem(dirItemType, dirItemName, this.renderDirContentFileRow(reqRelPath, dirItemName, itemStats)));
        }
        resolve();
    };
    /**
     * @summary Display directory content - complete directory row code for directory content:
     */
    DirectoriesHandler.prototype.renderDirContentDirRow = function (reqRelPath, dirItemName, itemStats) {
        var baseUrl = this.server.GetBasePath();
        var hrefParts = [];
        if (baseUrl)
            hrefParts.push(baseUrl);
        if (reqRelPath)
            hrefParts.push(reqRelPath);
        hrefParts.push(StringHelper_1.StringHelper.Trim(dirItemName, '/'));
        return Server_1.Server.DEFAULTS.RESPONSES.CODES.DIR_ROW
            .replace('%href%', '/' + hrefParts.join('/') + '/')
            .replace('%path%', StringHelper_1.StringHelper.HtmlEntitiesEncode(dirItemName))
            .replace('%date%', DateHelper_1.DateHelper.FormatForDirOutput(itemStats.mtime));
    };
    /**
     * @summary Display directory content - complete file row code for directory content:
     */
    DirectoriesHandler.prototype.renderDirContentFileRow = function (reqRelPath, fileItemName, itemStats) {
        if (itemStats === void 0) { itemStats = null; }
        var date, size = 0, baseUrl = this.server.GetBasePath();
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
        hrefParts.push(StringHelper_1.StringHelper.Trim(fileItemName, '/'));
        return Server_1.Server.DEFAULTS.RESPONSES.CODES.FILE_ROW
            .replace('%href%', '/' + hrefParts.join('/'))
            .replace('%path%', StringHelper_1.StringHelper.HtmlEntitiesEncode(fileItemName))
            .replace('%filesize%', NumberHelper_1.NumberHelper.FormatFileSize(size))
            .replace('%date%', DateHelper_1.DateHelper.FormatForDirOutput(date));
    };
    /**
     * @summary Display directory content - send directory content html code:
     */
    DirectoriesHandler.prototype.handleDirContentRows = function (statusCode, path, fullPath, dirStats, dirRows, fileRows, res) {
        var headerCode = '', listCode = '', outputStr = '';
        dirRows.sort(DirItem_1.DirItem.SortByPath);
        fileRows.sort(DirItem_1.DirItem.SortByPath);
        if (statusCode == 200) {
            headerCode = this.handleDirReqCompleteHeader(path, fullPath, dirStats);
            if (path) {
                dirRows.unshift(new DirItem_1.DirItem(DirItem_1.DirItem.TYPE_DIR, '..', this.renderDirContentDirRow(path, '..', dirStats)));
            }
            dirRows.forEach(function (item) {
                listCode += item.code;
            });
            fileRows.forEach(function (item) {
                listCode += item.code;
            });
            outputStr = Server_1.Server.DEFAULTS.RESPONSES.CODES.HTML
                .replace('%head%', Server_1.Server.DEFAULTS.RESPONSES.CODES.HEAD_FOUND
                .replace('%fullPath%', fullPath))
                .replace('%icon%', Server_1.Server.DEFAULTS.RESPONSES.ICONS.FAVICON)
                .replace('%body%', headerCode + Server_1.Server.DEFAULTS.RESPONSES.CODES.LIST
                .replace('%tbody%', listCode));
        }
        else /*if (statusCode == 403)*/ {
            outputStr = Server_1.Server.DEFAULTS.RESPONSES.CODES.HTML
                .replace('%head%', Server_1.Server.DEFAULTS.RESPONSES.CODES.HEAD_NOT_ALLOWED)
                .replace('%icon%', Server_1.Server.DEFAULTS.RESPONSES.ICONS.FAVICON)
                .replace('%body%', Server_1.Server.DEFAULTS.RESPONSES.CODES.HEADER_NOT_ALLOWED);
        }
        res.SetHeader('Content-Type', 'text/html')
            .SetEncoding('utf-8')
            .SetCode(statusCode)
            .SetBody(outputStr)
            .Send();
    };
    /**
     * @summary Display directory content - complete heading code for directory content:
     */
    DirectoriesHandler.prototype.handleDirReqCompleteHeader = function (path, fullPath, dirStats) {
        var headerCode = '', pathStep = '', pathCodes = [], pathExploded = path.split('/'), portStr = this.server.GetPort().toString(), domain = this.server.GetHostname();
        if (pathExploded[0] != '') {
            for (var i = 0, l = pathExploded.length; i < l; i++) {
                pathStep += ((i > 0) ? '/' : '') + pathExploded[i];
                pathCodes.push('<a href="/' +
                    StringHelper_1.StringHelper.HtmlEntitiesEncode(pathStep) +
                    '/">' + pathExploded[i] + '/</a> ');
            }
        }
        else {
            pathCodes = [path];
        }
        headerCode = Server_1.Server.DEFAULTS.RESPONSES.CODES.HEADER_FOUND
            .replace('%domain%', StringHelper_1.StringHelper.HtmlEntitiesEncode(domain))
            .replace('%port%', portStr)
            .replace('%path%', pathCodes.join(''))
            .replace('%fullPath%', fullPath)
            .replace('%lastMod%', DateHelper_1.DateHelper.FormatForDirOutput(dirStats.mtime));
        return headerCode;
    };
    return DirectoriesHandler;
}());
exports.DirectoriesHandler = DirectoriesHandler;
//# sourceMappingURL=Directory.js.map