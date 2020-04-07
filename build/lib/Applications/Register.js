Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs_1 = tslib_1.__importDefault(require("fs"));
var path_1 = tslib_1.__importDefault(require("path"));
var Record_1 = require("./Registers/Record");
var Register = /** @class */ (function () {
    function Register(server) {
        this.store = new Map();
        this.requireCacheWatched = new Map();
        this.requireCacheDependencies = new Map();
        this.server = server;
    }
    /**
     * @summary Initialize filesystem change or rename handler for given fullpath file to clear necessary require cache modules:
     */
    Register.prototype.InitRequireCacheItemsWatchHandlers = function (requiredByFullPath, cacheKeysToWatchFullPaths) {
        var _this = this;
        cacheKeysToWatchFullPaths.forEach(function (cacheKeyToWatchFullPath, i) {
            // set up dependencies:
            var dependencies = new Map();
            if (_this.requireCacheDependencies.has(cacheKeyToWatchFullPath))
                dependencies = _this.requireCacheDependencies.get(cacheKeyToWatchFullPath);
            for (var j = 0, k = cacheKeysToWatchFullPaths.length; j < k; j++) {
                if (j !== i)
                    dependencies.set(cacheKeysToWatchFullPaths[j], true);
            }
            dependencies.set(requiredByFullPath, true);
            _this.requireCacheDependencies.set(cacheKeyToWatchFullPath, dependencies);
            // watch directory if necessary:
            var lastSlashPos = cacheKeyToWatchFullPath.lastIndexOf('/');
            if (lastSlashPos !== -1) {
                var cacheDirKeyToWatch = cacheKeyToWatchFullPath.substr(0, lastSlashPos);
                if (!_this.requireCacheWatched.has(cacheDirKeyToWatch)) {
                    _this.requireCacheWatched.set(cacheDirKeyToWatch, true);
                    fs_1.default.watch(cacheDirKeyToWatch, { persistent: true, recursive: true }, function (eventType, filename) {
                        if (filename.length > 3 && filename.substr(-3).toLowerCase() == '.js') {
                            // eventType => 'change' | 'rename'
                            var clearedKeys = new Map();
                            _this.clearRequireCacheRecursive(cacheDirKeyToWatch + '/' + filename, clearedKeys);
                        }
                    });
                }
            }
        });
    };
    Register.prototype.TryToFindParentDirectoryIndexScriptModule = function (pathsToFound) {
        var dirIndexScriptsModule = null, pathToFound = '', documentRoot = this.server.GetDocumentRoot();
        for (var i = 0, l = pathsToFound.length; i < l; i += 1) {
            pathToFound = path_1.default.resolve(documentRoot + pathsToFound[i]).replace(/\\/g, '/');
            if (this.store.has(pathToFound)) {
                dirIndexScriptsModule = this.store.get(pathToFound);
                break;
            }
        }
        return dirIndexScriptsModule;
    };
    Register.prototype.GetIndexScriptModuleRecord = function (fullPath) {
        var indexScriptModuleRecord = null;
        if (this.store.has(fullPath))
            indexScriptModuleRecord = this.store.get(fullPath);
        return indexScriptModuleRecord;
    };
    Register.prototype.SetNewIndexScriptModuleRecord = function (appInstance, indexScriptModTime, indexScript, dirFullPath) {
        this.store.set(dirFullPath, new Record_1.Record(appInstance, indexScriptModTime, indexScript, dirFullPath));
        return this;
    };
    /**
     * @summary Get registered running apps count.
     * @param cb
     */
    Register.prototype.GetSize = function () {
        return this.store.size;
    };
    /**
     * @summary Stop all running registered app instances.
     * @param cb
     */
    Register.prototype.StopAll = function (cb) {
        var _this = this;
        var promises = [];
        if (this.store.size === 0)
            return cb();
        this.store.forEach(function (record, fullPath) {
            promises.push(new Promise(function (resolve, reject) {
                if (!record.instance)
                    return resolve();
                if (!record.instance.Stop)
                    return resolve();
                (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var fullPathResolved;
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, record.instance.Stop(this.server)];
                            case 1:
                                _a.sent();
                                fullPathResolved = require.resolve(fullPath);
                                if (typeof (require.cache[fullPathResolved]) != 'undefined')
                                    delete require.cache[fullPathResolved];
                                resolve();
                                return [2 /*return*/];
                        }
                    });
                }); })();
            }));
        });
        Promise.all(promises).then(cb);
    };
    /**
     * @summary Delete cached module from Node.JS require cache by full path.
     */
    Register.prototype.ClearModuleInstanceCacheAndRequireCache = function (fullPath) {
        var fullPathResolved = require.resolve(fullPath);
        if (typeof (require.cache[fullPathResolved]) != 'undefined') {
            delete require.cache[fullPathResolved];
            if (this.server.IsDevelopment())
                console.info('Module cache cleaned for: "' + fullPathResolved + '"');
        }
        this.store.delete(fullPath);
    };
    Register.prototype.ClearDirectoryModules = function () {
        this.store = new Map();
        return this;
    };
    /**
     * @summary Clear require cache recursively with cleaning module dependencies:
     */
    Register.prototype.clearRequireCacheRecursive = function (fullPath, clearedKeys) {
        var _this = this;
        clearedKeys.set(fullPath, true);
        if (typeof (require.cache[fullPath]) != 'undefined') {
            delete require.cache[fullPath];
            if (this.server.IsDevelopment())
                console.info('Module cache cleaned for: "' + fullPath + '"');
        }
        this.store.delete(fullPath);
        if (this.requireCacheDependencies.has(fullPath)) {
            var dependencies = this.requireCacheDependencies.get(fullPath);
            this.requireCacheDependencies.delete(fullPath);
            dependencies.forEach(function (val, dependencyFullPath, string) {
                if (!clearedKeys.has(dependencyFullPath))
                    _this.clearRequireCacheRecursive(dependencyFullPath, clearedKeys);
            });
            this.requireCacheDependencies.set(fullPath, dependencies);
        }
    };
    Register.GetRequireCacheDifferenceKeys = function (cacheKeysBeforeRequire, cacheKeysAfterRequire, requiredBy, doNotIncludePath) {
        var result = [], record;
        for (var i = 0, l = cacheKeysAfterRequire.length; i < l; i += 1) {
            record = cacheKeysAfterRequire[i];
            if (cacheKeysBeforeRequire.indexOf(record) == -1)
                if (record !== requiredBy && record.indexOf(doNotIncludePath) !== 0)
                    result.push(record);
        }
        return result;
    };
    return Register;
}());
exports.Register = Register;
//# sourceMappingURL=Register.js.map