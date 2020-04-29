var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Server_1 = require("../../lib/Server");
var rootDir = __dirname + '/../../..';
var logger = Server_1.Tools.Logger.CreateNew(rootDir, rootDir)
    .SetStreamWriting(!true)
    .SetStackTraceWriting(true, true);
var customStore = new Map();
var delayedWriting = new Map();
Server_1.Session.SetLoadHandler(function (id, store, exists) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                store.set(id, null);
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        setTimeout(function () {
                            //console.log("session load from external storrage...");
                            if (customStore.has(id)) {
                                store.set(id, customStore.get(id));
                            }
                            else if (exists) {
                                store.delete(id);
                            }
                            else {
                                var newSession = new Server_1.Session(id, false);
                                store.set(id, newSession);
                            }
                            resolve();
                        }, 100);
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
Server_1.Session.SetWriteHandler(function (id, store) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var timeoutId;
    return tslib_1.__generator(this, function (_a) {
        if (delayedWriting.has(id)) {
            timeoutId = delayedWriting.get(id);
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(function () {
            delayedWriting.delete(id);
            //console.log("session write into external storrage...");
            customStore.set(id, store.get(id));
        }, 5000);
        delayedWriting.set(id, timeoutId);
        return [2 /*return*/];
    });
}); });
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