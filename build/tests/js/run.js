//var WebDevServer = require("../build/server");
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var WebDevServer = tslib_1.__importStar(require("../lib/Server"));
var rootDir = __dirname + '/..';
/*var loggerInstance = WebDevServer.Logger.CreateNew(
    rootDir, rootDir
).SetStackTraceWriting(true, true);*/
WebDevServer.Server.CreateNew()
    .SetDocumentRoot(rootDir) // required
    .SetPort(8000) // optional, 8000 by default
    .SetHostname('note-tests.local') // optional, localhost by default
    //.SetDevelopment(false)						// optional, true by default to display Errors and directory content
    //.SetBasePath('/node')							// optional, null by default, useful for apache proxy modes
    .SetErrorHandler(function (err, code, req, res) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    return tslib_1.__generator(this, function (_a) {
        console.error(err);
        return [2 /*return*/];
    });
}); })
    .AddPreHandler(function (req, res, event) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    return tslib_1.__generator(this, function (_a) {
        return [2 /*return*/];
    });
}); })
    .Run();
//# sourceMappingURL=run.js.map