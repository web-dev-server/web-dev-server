Object.defineProperty(exports, "__esModule", { value: true });
exports.Record = void 0;
var Record = /** @class */ (function () {
    function Record(instance, modTime, scriptName, fullPath) {
        this.Instance = instance;
        this.IndexScriptModTime = modTime;
        this.IndexScriptFileName = scriptName;
        this.DirectoryFullPath = fullPath;
    }
    ;
    return Record;
}());
exports.Record = Record;
//# sourceMappingURL=Record.js.map