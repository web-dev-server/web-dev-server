Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var path_1 = tslib_1.__importDefault(require("path"));
var FilesHandler = /** @class */ (function () {
    function FilesHandler(errorsHandler) {
        this.errorsHandler = errorsHandler;
    }
    /**
     * @summary Send a file:
     */
    FilesHandler.prototype.HandleFile = function (stats, path, fullPath, req, res, cb) {
        var _this = this;
        res.status(200).setHeader('Content-Length', stats.size);
        res.sendFile(path_1.default.normalize(fullPath), { lastModified: stats.mtime.toUTCString() }, function (err) {
            if (err)
                _this.errorsHandler.PrintError(err, req, res, 403);
            return cb();
        });
    };
    return FilesHandler;
}());
exports.FilesHandler = FilesHandler;
//# sourceMappingURL=files-handler.js.map