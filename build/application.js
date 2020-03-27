Object.defineProperty(exports, "__esModule", { value: true });
var Application;
(function (Application) {
    var Abstract = /** @class */ (function () {
        function Abstract(httpServer, expressApp, sessionParser, request, response) {
            this.httpServer = httpServer;
            this.expressApp = expressApp;
            this.sessionParser = sessionParser;
        }
        ;
        return Abstract;
    }());
    Application.Abstract = Abstract;
})(Application = exports.Application || (exports.Application = {}));
//# sourceMappingURL=application.js.map