Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs = require("fs");
var WebDevServer = require("../../../lib/Server");
/**
 * @summary
 * Exported class to handle directory requests.
 *
 * When there is first request to directory with default
 * `index.js` script inside, this class is automatically
 * created and method `Start()` is executed.
 * All request are normally handled by method `HttpHandle()`.
 * If there is detected any file change inside this file
 * or inside file included in this file (on development server
 * instance), the module `web-dev-server` automaticly reloads
 * all necesssary dependent source codes, stops previous instance
 * by method `Stop`() and recreates this application instance again
 * by `Start()` method. The same realoding procedure is executed,
 * if there is any unhandled error inside method `HttpHandle()`
 * (to develop more comfortably).
 */
var App = /** @class */ (function () {
    function App() {
    }
    /**
     * @summary Application start point.
     * @public
     * @param {WebDevServer.Server}   server
     * @param {WebDevServer.Request}  firstRequest
     * @param {WebDevServer.Response} firstResponse
     * @return {Promise<void>}
     */
    App.prototype.Start = function (server, firstRequest, firstResponse) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                /**
                 * @summary WebDevServer server instance.
                 * @var {WebDevServer.Server}
                 */
                this.server = server;
                /**
                 * @summary Requests counter.
                 * @var {number}
                 */
                this.counter = 0;
                // Any initializations:
                console.log("App start.");
                return [2 /*return*/];
            });
        });
    };
    /**
     * @summary Application end point, called on unhandled error
     * (on development server instance) or on server stop event.
     * @public
     * @param {WebDevServer.Server} server
     * @return {Promise<void>}
     */
    App.prototype.Stop = function (server) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                // Any destructions:
                console.log("App stop.");
                return [2 /*return*/];
            });
        });
    };
    /**
     * @summary
     * This method is executed each request to directory with
     * `index.js` script inside (also executed for first time
     * immediately after `Start()` method).
     * @public
     * @param {WebDevServer.Request}  request
     * @param {WebDevServer.Response} response
     * @return {Promise<void>}
     */
    App.prototype.HttpHandle = function (request, response) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var stopParam, sessionExists, sessionInitParam, session, sessionNamespace, staticHtmlFileFullPath, data;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("App http handle.", request.GetFullUrl());
                        // increase request counter:
                        this.counter++;
                        stopParam = request.GetParam('stop', '0-9');
                        if (stopParam) {
                            response
                                .SetHeader('connection', 'close')
                                .SetBody("stopped")
                                .Send(true, function () {
                                _this.server.Stop();
                            });
                            return [2 /*return*/];
                        }
                        sessionExists = WebDevServer.Session.Exists(request);
                        sessionInitParam = request.GetParam('session_init', '\\d');
                        if (!!sessionExists) return [3 /*break*/, 2];
                        if (!sessionInitParam)
                            return [2 /*return*/, response.Redirect('?session_init=1')];
                        return [4 /*yield*/, WebDevServer.Session.Start(request, response)];
                    case 1:
                        (_a.sent()).GetNamespace("test").value = 0;
                        return [2 /*return*/, response.Redirect(request.GetRequestUrl())];
                    case 2: return [4 /*yield*/, WebDevServer.Session.Start(request, response)];
                    case 3:
                        session = _a.sent();
                        sessionNamespace = session.GetNamespace("test").SetExpirationSeconds(30);
                        sessionNamespace.value += 1;
                        staticHtmlFileFullPath = this.server.GetDocumentRoot() + "/src/tests/assets/index.html";
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                fs.readFile(staticHtmlFileFullPath, 'utf8', function (err, data) {
                                    // try to uncomment line bellow to see rendered error in browser:
                                    try {
                                        //throw new Error("Uncatched test error 2.");
                                    }
                                    catch (e) {
                                        err = e;
                                    }
                                    if (err)
                                        return reject(err);
                                    resolve(data);
                                });
                            })];
                    case 4:
                        data = _a.sent();
                        response.SetBody(data.replace(/%code%/g, JSON.stringify({
                            basePath: request.GetBasePath(),
                            path: request.GetPath(),
                            domainUrl: request.GetDomainUrl(),
                            baseUrl: request.GetBaseUrl(),
                            requestUrl: request.GetRequestUrl(),
                            fullUrl: request.GetFullUrl(),
                            params: request.GetParams(false, false),
                            appRequests: this.counter,
                            sessionTestValue: sessionNamespace.value
                        }, null, "\t"))).Send();
                        return [2 /*return*/];
                }
            });
        });
    };
    return App;
}());
exports.default = App;
//# sourceMappingURL=index.js.map