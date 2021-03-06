Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs = tslib_1.__importStar(require("fs"));
var Server_1 = require("../../../lib/Server");
/**
 * @summary Exported class to handle directory requests.
 */
var App = /** @class */ (function () {
    function App() {
        /** @summary Requests counter. */
        this.counter = 0;
    }
    /**
     * @summary Application start point, which is executed only once,
     * 			when there is a request to directory with default `index.js`
     * 			script inside. Then it's automatically created an instance
     * 			of `module.exports` content. Then it's executed
     * 			`handleHttpRequest` method on that instance.
     * 			This is the way, how is directory request handled with
     * 			default `index.js` file inside.
     * 			If there is detected any file change inside this file
     * 			(or inside file included in this file), the module
     * 			`web-deb-server` automaticly reloads all necesssary
     * 			dependent source codes and creates this application
     * 			instance again. The same realoding procedure is executed,
     * 			if there is any unhandled error inside method
     * 			`handleHttpRequest` (to develop more comfortably).
     */
    App.prototype.Start = function (server, firstRequest, firstResponse) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                this.server = server;
                // Any initializations:
                console.log("App start.");
                return [2 /*return*/];
            });
        });
    };
    /**
     *
     * @param server
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
     * @summary This method is executed each request to directory with
     * 			`index.js` script inside (also executed for first time
     * 			immediately after constructor).
     */
    App.prototype.HttpHandle = function (request, response) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var stopParam, sessionInitParam, sessionExists, session, sessionNamespace, staticHtmlFileFullPath, data;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("App http handle.", request.GetFullUrl());
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
                        // increase request counter:
                        this.counter++;
                        sessionInitParam = request.GetParam('session_init', '\\d');
                        if (!sessionInitParam) return [3 /*break*/, 2];
                        return [4 /*yield*/, Server_1.Session.Start(request, response)];
                    case 1:
                        (_a.sent()).GetNamespace("test").value = 0;
                        return [2 /*return*/, response.Redirect(request.GetRequestUrl())];
                    case 2: return [4 /*yield*/, Server_1.Session.Exists(request)];
                    case 3:
                        sessionExists = _a.sent();
                        if (!sessionExists)
                            return [2 /*return*/, response.Redirect('?session_init=1')];
                        return [4 /*yield*/, Server_1.Session.Start(request, response)];
                    case 4:
                        session = _a.sent();
                        sessionNamespace = session.GetNamespace("test").SetExpirationSeconds(30);
                        sessionNamespace.value += 1;
                        if (!!request.IsCompleted()) return [3 /*break*/, 6];
                        return [4 /*yield*/, request.GetBody()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
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
                    case 7:
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