Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var crypto_1 = require("crypto");
var Namespace_1 = require("./Sessions/Namespace");
var Session = /** @class */ (function () {
    function Session(id) {
        this.id = id;
        this.locked = false;
        this.lastAccessTime = +new Date;
        this.namespacesHoops = new Map();
        this.namespacesExpirations = new Map();
        this.namespaces = new Map();
    }
    /**
     * @summary Set max waiting time in seconds to unlock session for another request.
     * @param maxLockWaitTime
     */
    Session.SetMaxLockWaitTime = function (maxLockWaitTime) {
        this.maxLockWaitTime = maxLockWaitTime * 1000;
        return this;
    };
    /**
     * @summary Set used cookie name to identify session.
     * @param cookieName
     */
    Session.SetCookieName = function (cookieName) {
        this.cookieName = cookieName;
        return this;
    };
    /**
     * @summary Set max. lifetime for all sessions and it's namespaces.
     * @param maxLifeTimeSeconds
     */
    Session.SetMaxLifeTime = function (maxLifeTimeSeconds) {
        this.maxLifeTimeMiliSeconds = maxLifeTimeSeconds === 0 ? 0 : maxLifeTimeSeconds * 1000;
        return this;
    };
    /**
     * @summary Get max. lifetime for all sessions and it's namespaces in seconds.
     */
    Session.GetMaxLifeTime = function () {
        if (this.maxLifeTimeMiliSeconds === 0)
            return 0;
        return Math.round(this.maxLifeTimeMiliSeconds / 1000);
    };
    /**
     * Destroy all running sessions.
     */
    Session.DestroyAll = function () {
        this.store.forEach(function (session) { return session.Destroy(); });
        this.store = new Map();
        return this;
    };
    /**
     * Start session based on cookies and data stored in current process.
     * @param request
     * @param response
     */
    Session.Start = function (request, response) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var session, id;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = this.getRequestIdOrNew(request);
                        if (this.store.has(id)) {
                            session = this.store.get(id);
                            if (this.maxLifeTimeMiliSeconds !== 0 &&
                                session.lastAccessTime + this.maxLifeTimeMiliSeconds < (+new Date)) {
                                session = new Session(id);
                                this.store.set(id, session);
                            }
                        }
                        else {
                            session = new Session(id);
                            this.store.set(id, session);
                        }
                        if (!session.locked) return [3 /*break*/, 2];
                        return [4 /*yield*/, session.waitForUnlock()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        session.init();
                        this.setResponseCookie(response, session);
                        return [2 /*return*/, session];
                }
            });
        });
    };
    /**
     * @summary Check if any session data exists for given request.
     * @param request
     */
    Session.Exists = function (request) {
        var id = request.GetCookie(this.cookieName, "a-zA-Z0-9");
        return this.store.has(id);
    };
    Session.setResponseCookie = function (response, session) {
        session.lastAccessTime = +new Date;
        var expireDate = null;
        if (this.maxLifeTimeMiliSeconds !== 0) {
            expireDate = new Date();
            expireDate.setTime(session.lastAccessTime + this.maxLifeTimeMiliSeconds);
        }
        response.On("session-unlock", function () {
            session.lastAccessTime = +new Date;
            session.locked = false;
        });
        response.SetCookie({
            name: this.cookieName,
            value: session.GetId(),
            expires: expireDate,
            path: '/',
            httpOnly: true
        });
    };
    Session.getRequestIdOrNew = function (request) {
        var id = request.GetCookie(this.cookieName, "a-zA-Z0-9");
        if (id == null) {
            while (true) {
                id = crypto_1.randomBytes(20).toString('hex').toLowerCase();
                if (!this.store.has(id))
                    break;
            }
        }
        else {
            id = id.toLowerCase();
        }
        return id;
    };
    /**
     * @summary Get session id string.
     */
    Session.prototype.GetId = function () {
        return this.id;
    };
    /**
     * Get new or existing session namespace instance.
     * @param name Session namespace unique name.
     */
    Session.prototype.GetNamespace = function (name) {
        if (name === void 0) { name = 'default'; }
        var result;
        if (this.namespaces.has(name)) {
            result = this.namespaces.get(name);
        }
        else {
            result = Namespace_1.createNamespace(name, this);
            this.namespaces.set(name, result);
        }
        return result;
    };
    /**
     * @summary Destroy all namespaces and this session for current user.
     */
    Session.prototype.Destroy = function () {
        Session.store.delete(this.id);
        this.id = null;
        this.lastAccessTime = null;
        this.namespaces = null;
    };
    Session.prototype.waitForUnlock = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var maxWaitingTime, startTime, timeoutHandler;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                if (!this.locked)
                    return [2 /*return*/];
                maxWaitingTime = Session.maxLockWaitTime;
                startTime = +new Date;
                timeoutHandler = function (resolve) {
                    if (!_this.locked) {
                        _this.locked = true;
                        return resolve();
                    }
                    var nowTime = +new Date;
                    if (startTime + maxWaitingTime < nowTime)
                        return resolve();
                    setTimeout(function () {
                        timeoutHandler(resolve);
                    }, 100);
                };
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        setTimeout(function () {
                            timeoutHandler(resolve);
                        }, 1000);
                    })];
            });
        });
    };
    Session.prototype.setLastAccessTime = function (lastAccessTime) {
        this.lastAccessTime;
        return this;
    };
    Session.prototype.destroyNamespace = function (name) {
        if (this.namespaces.has(name))
            this.namespaces.delete(name);
        return this;
    };
    Session.prototype.setNamespaceExpirationHoops = function (name, hoopsCount) {
        this.namespacesHoops.set(name, hoopsCount);
        return this;
    };
    Session.prototype.setNamespaceExpirationTime = function (name, seconds) {
        var maxLifeTimeSeconds = Session.GetMaxLifeTime();
        if (seconds > maxLifeTimeSeconds && maxLifeTimeSeconds > 0)
            seconds = maxLifeTimeSeconds;
        var expDate = new Date();
        expDate.setTime(expDate.getTime() + (seconds * 1000));
        this.namespacesExpirations.set(name, expDate.getTime());
        return this;
    };
    Session.prototype.init = function () {
        var _this = this;
        this.locked = true;
        var nowTime = (new Date()).getTime();
        this.namespacesHoops.forEach(function (hoopsCount, name) {
            _this.namespacesHoops.set(name, hoopsCount - 1);
        });
        var namesToUnset = new Map();
        this.namespaces.forEach(function (namespace, name) {
            if (_this.namespacesHoops.has(name) &&
                _this.namespacesHoops.get(name) < 0)
                namesToUnset.set(name, true);
            if (_this.namespacesExpirations.has(name) &&
                _this.namespacesExpirations.get(name) < nowTime)
                namesToUnset.set(name, true);
        });
        namesToUnset.forEach(function (bool, name) {
            if (_this.namespacesHoops.has(name))
                _this.namespacesHoops.delete(name);
            if (_this.namespacesExpirations.has(name))
                _this.namespacesExpirations.delete(name);
            _this.namespaces.delete(name);
        });
    };
    Session.LIFETIMES = {
        MINUTE: 60, HOUR: 3600, DAY: 86400, WEEK: 604800, MONTH: 2592000, YEAR: 31557600
    };
    Session.store = new Map();
    Session.maxLockWaitTime = 30000; // 30 seconds
    Session.cookieName = 'sessionid';
    Session.maxLifeTimeMiliSeconds = 0;
    Session.hashSalt = '';
    return Session;
}());
exports.Session = Session;
//# sourceMappingURL=Session.js.map