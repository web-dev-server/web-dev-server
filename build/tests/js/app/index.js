Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs = tslib_1.__importStar(require("fs"));
var WebDevServer = tslib_1.__importStar(require("../../lib/Server"));
/**
 * @summary Exported class to handle directory requests.
 */
var App = /** @class */ (function (_super) {
    tslib_1.__extends(App, _super);
    /**
     * @summary Application constructor, which is executed only once,
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
    function App(server, request, response) {
        var _this = _super.call(this, server) || this;
        /** @summary Requests counter. */
        _this.counter = 0;
        // Any initializations:
        request.GetPath();
        response.IsSentHeaders();
        return _this;
    }
    /**
     * @summary This method is executed each request to directory with
     * 			`index.js` script inside (also executed for first time
     * 			immediately after constructor).
     */
    App.prototype.ServerHandler = function (request, response) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var staticHtmlFileFullPath, data;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // increase request counter:
                        this.counter++;
                        staticHtmlFileFullPath = __dirname + '/../../../src/tests/app/index.html';
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                fs.readFile(staticHtmlFileFullPath, 'utf8', function (err, data) {
                                    // try to uncomment line bellow to see rendered error in browser:
                                    //throw new Error("Uncatched test error.");
                                    if (err)
                                        return reject(err);
                                    resolve(data);
                                });
                            })];
                    case 1:
                        data = _a.sent();
                        response.SetBody(data.replace(/%requestPath/g, request.GetPath() + " (" + this.counter.toString() + "×)")).Send();
                        return [2 /*return*/];
                }
            });
        });
    };
    return App;
}(WebDevServer.Applications.Abstract));
exports.default = App;
//# sourceMappingURL=index.js.map