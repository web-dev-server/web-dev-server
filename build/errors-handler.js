Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var url_1 = tslib_1.__importDefault(require("url"));
var server_1 = require("./server");
var helpers_1 = require("./helpers");
var ErrorsHandler = /** @class */ (function () {
    function ErrorsHandler(server, cache) {
        // development purposes:
        this.request = null;
        this.response = null;
        this.callback = null;
        this.server = server;
        this.cache = cache;
        this.initErrorsHandlers();
    }
    ErrorsHandler.prototype.SetHandledRequestProperties = function (req, res, cb) {
        if (req === void 0) { req = null; }
        if (res === void 0) { res = null; }
        this.request = req;
        this.response = res;
        this.callback = cb;
        return this;
    };
    /**
     * @summary Print exception in command line a little more nicely and send error in response:
     */
    ErrorsHandler.prototype.PrintError = function (e, req, res, code) {
        if (req === void 0) { req = null; }
        if (res === void 0) { res = null; }
        if (code === void 0) { code = 500; }
        var development = this.server.IsDevelopment(), customErrorHandler = this.server.GetErrorHandler(), noErrorHandler = customErrorHandler === null, errorText = (development || noErrorHandler)
            ? this.renderErrorText(e)
            : '';
        if (noErrorHandler) {
            if (development)
                console.log("\n");
            console.error(errorText);
            if (development)
                console.log("\n");
        }
        else {
            try {
                customErrorHandler(e, code, req, res);
            }
            catch (e1) {
                if (development)
                    console.log("\n");
                console.error(e1.message);
                if (development)
                    console.log("\n");
            }
        }
        if (!res || (res && res.finished))
            return;
        if (!res.headersSent) {
            res.setHeader('Content-Type', development ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8');
            res.writeHead(code);
        }
        if (development) {
            res.write("/*\n" + errorText + "\n*/");
        }
        else {
            if (code == 404) {
                var headerCode = server_1.Server.DEFAULTS.RESPONSES.CODES.HEADER_NOT_FOUND
                    .replace('%path%', helpers_1.Helpers.HtmlEntitiesEncode(url_1.default.parse(req.url).pathname));
                var outputStr = server_1.Server.DEFAULTS.RESPONSES.CODES.HTML
                    .replace('%head%', server_1.Server.DEFAULTS.RESPONSES.CODES.HEAD_NOT_FOUND)
                    .replace('%body%', headerCode);
            }
            else {
                var outputStr = server_1.Server.DEFAULTS.RESPONSES.CODES.HTML
                    .replace('%head%', server_1.Server.DEFAULTS.RESPONSES.CODES.HEAD_ERROR)
                    .replace('%body%', server_1.Server.DEFAULTS.RESPONSES.CODES.HEADER_ERROR);
            }
            res.write(outputStr);
        }
        res.end();
    };
    /**
     * @summary Initialize uncatch error and uncatch warning handlers
     */
    ErrorsHandler.prototype.initErrorsHandlers = function () {
        var _this = this;
        /** @var process NodeJS.Process */
        process.on('uncaughtException', this.handleUncatchError.bind(this, true));
        process.on('warning', this.handleUncatchError.bind(this, false));
        process.on('unhandledRejection', function (reason, promise) {
            if (reason instanceof Error) {
                _this.handleUncatchError(true, reason);
            }
            else {
                var reasonMsg;
                try {
                    reasonMsg = JSON.stringify(reason);
                }
                catch (e1) {
                    reasonMsg = reason.toString();
                }
                try {
                    throw new Error(reasonMsg);
                }
                catch (e2) {
                    _this.handleUncatchError(true, e2);
                }
            }
        });
    };
    /**
     * @summary Clear all modules on any uncatched error
     */
    ErrorsHandler.prototype.handleUncatchError = function (clearRequireCache, error) {
        var development = this.server.IsDevelopment();
        if (development && clearRequireCache) {
            this.cache.ClearDirectoryModules();
            var requireCacheKeys = Object.keys(require.cache);
            for (var i = 0, l = requireCacheKeys.length; i < l; i++)
                delete require.cache[requireCacheKeys[i]];
        }
        if (development) {
            this.PrintError(error, this.request, this.response, 500);
            if (this.callback !== null) {
                try {
                    this.callback();
                }
                catch (e) {
                    this.PrintError(e, this.request, this.response, 500);
                }
            }
        }
        else {
            this.PrintError(error, null, null, 500);
        }
    };
    /**
     * @summary Render error as text for development purposes:
     */
    ErrorsHandler.prototype.renderErrorText = function (e) {
        if (e === void 0) { e = null; }
        if (!e || !e.stack)
            return '';
        var documentRoot = this.server.GetDocumentRoot(), stackLines = e.stack.replace(/\r/g, '').split("\n"), stackLine;
        for (var i = 1, l = stackLines.length; i < l; i++) {
            stackLine = stackLines[i].replace(/\\/g, '/');
            if (stackLine.indexOf(documentRoot) > -1)
                stackLines[i] = stackLine.replace(documentRoot, '');
        }
        return stackLines.join("\n");
    };
    return ErrorsHandler;
}());
exports.ErrorsHandler = ErrorsHandler;
//# sourceMappingURL=errors-handler.js.map