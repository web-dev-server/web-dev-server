Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs_1 = tslib_1.__importDefault(require("fs"));
var path_1 = tslib_1.__importDefault(require("path"));
var Cache = /** @class */ (function () {
    function Cache(server) {
        this.dirIndexScriptModules = new Map();
        this.requireCacheWatched = new Map();
        this.requireCacheDependencies = new Map();
        this.server = server;
    }
    /**
     * @summary Initialize filesystem change or rename handler for given fullpath file to clear necessary require cache modules:
     */
    Cache.prototype.InitRequireCacheItemsWatchHandlers = function (requiredByFullPath, cacheKeysToWatchFullPaths) {
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
                        //console.log(["dir", eventType, filename, cacheDirKeyToWatch]);
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
    Cache.prototype.TryToFindParentDirectoryIndexScriptModule = function (pathsToFound) {
        var dirIndexScriptsModule = null, pathToFound = '', pathsToFound = [], documentRoot = this.server.GetDocumentRoot();
        for (var i = 0, l = pathsToFound.length; i < l; i += 1) {
            pathToFound = path_1.default.resolve(documentRoot + pathsToFound[i]).replace(/\\/g, '/');
            if (this.dirIndexScriptModules.has(pathToFound)) {
                dirIndexScriptsModule = this.dirIndexScriptModules.get(pathToFound);
                break;
            }
        }
        return dirIndexScriptsModule;
    };
    Cache.prototype.GetIndexScriptModuleRecord = function (fullPath) {
        var indexScriptModuleRecord = null;
        if (this.dirIndexScriptModules.has(fullPath))
            indexScriptModuleRecord = this.dirIndexScriptModules.get(fullPath);
        return indexScriptModuleRecord;
    };
    Cache.prototype.SetNewIndexScriptModuleRecord = function (appInstance, indexScriptModTime, indexScript, fullPath) {
        this.dirIndexScriptModules.set(fullPath, new CacheRecord(appInstance, indexScriptModTime, indexScript, fullPath));
        return this;
    };
    /**
     * @summary Delete cached module from Node.JS require cache by full path.
     */
    Cache.prototype.ClearModuleInstanceCacheAndRequireCache = function (fullPath) {
        var fullPathResolved = require.resolve(fullPath);
        if (typeof (require.cache[fullPathResolved]) != 'undefined') {
            delete require.cache[fullPathResolved];
            if (this.server.IsDevelopment())
                console.log('Module cache cleaned for: "' + fullPathResolved + '"');
        }
        this.dirIndexScriptModules.delete(fullPath);
    };
    Cache.prototype.ClearDirectoryModules = function () {
        this.dirIndexScriptModules = new Map();
        return this;
    };
    /**
     * @summary Clear require cache recursively with cleaning module dependencies:
     */
    Cache.prototype.clearRequireCacheRecursive = function (fullPath, clearedKeys) {
        var _this = this;
        clearedKeys.set(fullPath, true);
        if (typeof (require.cache[fullPath]) != 'undefined') {
            delete require.cache[fullPath];
            if (this.server.IsDevelopment())
                console.log('Module cache cleaned for: "' + fullPath + '"');
        }
        this.dirIndexScriptModules.delete(fullPath);
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
    return Cache;
}());
exports.Cache = Cache;
var CacheRecord = /** @class */ (function () {
    function CacheRecord(instance, modTime, scriptName, fullPath) {
        this.instance = instance;
        this.modTime = modTime;
        this.scriptName = scriptName;
        this.fullPath = fullPath;
    }
    ;
    return CacheRecord;
}());
exports.CacheRecord = CacheRecord;
//# sourceMappingURL=cache.js.map