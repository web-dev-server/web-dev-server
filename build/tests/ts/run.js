var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Server_1 = require("../../lib/Server");
var rootDir = __dirname + '/../../..';
var logger = Server_1.Tools.Logger.CreateNew(rootDir, rootDir)
    .SetStackTraceWriting(true, true);
Server_1.Server.CreateNew()
    .SetDocumentRoot(rootDir)
    .SetPort(8000)
    .SetHostname('web-dev-server.local') // optional, localhost by default
    .SetDevelopment(true)
    //.SetBasePath('/node')
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
            event.PreventDefault();
        }
        return [2 /*return*/];
    });
}); })
    .Start();
//# sourceMappingURL=run.js.map