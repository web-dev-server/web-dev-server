var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Server_1 = require("../../lib/Server");
var rootDir = __dirname + '/../../..';
var logger = Server_1.Tools.Logger.CreateNew(rootDir, rootDir)
    .SetStackTraceWriting(true, true);
Server_1.Server.CreateNew()
    .SetDocumentRoot(rootDir) // required
    .SetPort(8000) // optional, 8000 by default
    .SetHostname('web-dev-server.local') // optional, localhost by default
    .SetDevelopment(true) // optional, true by default to display Errors and directory content
    //.SetBasePath('/node')					// optional, null by default, useful for apache proxy modes
    .SetErrorHandler(function (err, code, req, res) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    return tslib_1.__generator(this, function (_a) {
        console.error(err);
        logger.Error(err);
        return [2 /*return*/];
    });
}); })
    .AddPreHandler(function (req, res, event) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    return tslib_1.__generator(this, function (_a) {
        if (req.GetPath() == '/health') {
            res.SetCode(200).SetBody('1').Send();
            event.PreventDefault(); // do not anything else in `web-dev-server` module for this request
        }
        return [2 /*return*/];
    });
}); })
    .Run();
//# sourceMappingURL=run.js.map