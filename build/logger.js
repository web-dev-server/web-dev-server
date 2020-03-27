Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs_1 = tslib_1.__importDefault(require("fs"));
var v8_1 = tslib_1.__importDefault(require("v8"));
var path_1 = tslib_1.__importDefault(require("path"));
var helpers_1 = require("./helpers");
Error.prepareStackTrace = function (error, stacks) {
    Object.defineProperty(error, 'stacks', {
        configurable: false,
        writable: false,
        enumerable: true,
        value: stacks
    });
    return error.stack;
};
var Logger = /** @class */ (function () {
    /**
     * @summary Create new Logger instance.
     * @param logsDirFullPath Directory full path with log files.
     * @param documentRoot Application or project document root to simplify logged source file paths.
     */
    function Logger(logsDirFullPath, documentRoot) {
        var _this = this;
        this.streamWriting = false;
        this.maxLogFileSize = 52428800; // 50 MB by default
        this.allowedLevels = new Map();
        this.logsStreams = new Map();
        this.logsStreamsLengths = new Map();
        this.logsCaches = new Map();
        this.writeStackTrace = true;
        this.writeStackTraceFuncArgs = false;
        logsDirFullPath = path_1.default.resolve(logsDirFullPath).replace(/\\/g, '/');
        documentRoot = path_1.default.resolve(documentRoot).replace(/\\/g, '/');
        this.logsDirFullPath = helpers_1.Helpers.TrimRight(logsDirFullPath, '/');
        this.documentRoot = helpers_1.Helpers.TrimRight(documentRoot, '/');
        // allow all levels by default:
        for (var levelName in Logger.LEVEL)
            this.allowedLevels.set(Logger.LEVEL[levelName], true);
        process.on('beforeExit', function (code) {
            _this.logsStreams.forEach(function (stream, level) {
                try {
                    stream.end();
                    stream.close();
                }
                catch (e) { }
            });
        });
    }
    /**
     * @summary Create new Logger instance.
     * @param logsDirFullPath Directory full path with log files.
     * @param documentRoot Application or project document root to simplify logged source file paths.
     */
    Logger.CreateNew = function (logsDirFullPath, documentRoot) {
        return new Logger(logsDirFullPath, documentRoot);
    };
    /**
     * Get logger instance as singleton.
     */
    Logger.GetInstance = function () {
        return Logger.instance;
    };
    /**
     * Set logger instance as singleton.
     * @param loggetInstance Logger instance.
     */
    Logger.SetInstance = function (loggetInstance) {
        return Logger.instance = loggetInstance;
    };
    /**
     * Set max. bytes for each log file. 50 MB by default.
     * @see https://convertlive.com/u/convert/megabytes/to/bytes
     * @param maxBytes Max bytes to create another log file (as number of bytes or as string like: 1K, 5M, 1G or 1T).
     */
    Logger.prototype.SetMaxLogFileSize = function (maxBytes) {
        if (maxBytes === void 0) { maxBytes = '50M'; }
        if (!isNaN(maxBytes)) {
            this.maxLogFileSize = Number(maxBytes);
        }
        else {
            var maxBytesStr = String(maxBytes).toUpperCase();
            var numberStr = maxBytesStr.replace(/[^0-9\.]/g, '');
            var multiplier = maxBytesStr.replace(/[^KMGT]/g, '');
            if (numberStr.length == 0)
                throw new RangeError("Max. log file size is invalid.");
            var numberFloat = parseFloat(numberStr);
            if (multiplier.length > 0) {
                multiplier = multiplier.substr(0, 1);
                var multipliers = helpers_1.Helpers.ObjectToMap({
                    K: 1024,
                    M: 1048576,
                    G: 1073741824,
                    T: 1099511627776
                });
                if (multipliers.has(multiplier) &&
                    numberFloat * multipliers.get(multiplier) < Number.MAX_SAFE_INTEGER)
                    numberFloat *= multipliers.get(multiplier);
            }
            this.maxLogFileSize = numberFloat;
        }
        return this;
    };
    /**
     * @summary Enable or disable writing to logs by write streams. If disabled, there is used standard file append.
     * @param allowedLevels `true` to enable stream writing (for singleton logger) or `false` for multiple logger instances to the same files.
     */
    Logger.prototype.SetStreamWriting = function (streamWriting) {
        if (streamWriting === void 0) { streamWriting = true; }
        if (!streamWriting && this.streamWriting)
            this.logsStreams.forEach(function (stream, level) {
                try {
                    stream.end();
                    stream.close();
                }
                catch (e) { }
            });
        this.streamWriting = streamWriting;
        return this;
    };
    /**
     * Allowed levels to log. Rest of not presented levels are automatically disallowed.
     * @param allowedLevels Allowed levels to log like: `[Logger.LEVEL.ERROR, Logger.LEVEL.DEBUG, 'customname', ...]`
     */
    Logger.prototype.SetAllowedLevels = function (allowedLevels) {
        var _this = this;
        // set all existing levels to false first:
        this.allowedLevels.forEach(function (value, allowedLevelName) {
            _this.allowedLevels.set(allowedLevelName, false);
        });
        // allow only selected levels:
        for (var levelName in allowedLevels)
            this.allowedLevels.set(levelName, true);
        return this;
    };
    /**
     * Set how to write stack trace.
     * @param writeStackTrace If `true`, stack trace will be written into all log types, `false` otherwise, default `true`.
     * @param writeStackTraceFuncArgs If `true`, stack trace will be written with called functions arguments into all log types, `false` otherwise, default `true`. Arguments serialization could be very large.
     */
    Logger.prototype.SetStackTraceWriting = function (writeStackTrace, writeStackTraceFuncArgs) {
        if (writeStackTrace === void 0) { writeStackTrace = true; }
        if (writeStackTraceFuncArgs === void 0) { writeStackTraceFuncArgs = false; }
        this.writeStackTrace = writeStackTrace;
        if (writeStackTrace) {
            this.writeStackTraceFuncArgs = writeStackTraceFuncArgs;
        }
        else {
            this.writeStackTraceFuncArgs = false;
        }
        return this;
    };
    /**
     * @summary Log any error.
     * @param err Error instance to log or error message to generate an error internally and log the error instance.
     * @param level Log level (log file name).
     */
    Logger.prototype.Error = function (err, level) {
        if (level === void 0) { level = 'error'; }
        var date = new Date(), errMessage, errType, errStacks, stackTrace;
        // check if current log level is allowed:
        if (!this.allowedLevels.has(level) ||
            !this.allowedLevels.get(level))
            return this;
        // if input is string, turn it into error:
        if (err instanceof Error) {
            errType = helpers_1.Helpers.RealTypeOf(err);
            errMessage = err.message;
            if (this.writeStackTrace && err.stack.length > 0)
                errStacks = err['stacks'];
        }
        else {
            errType = 'Error';
            errMessage = err.toString();
            if (this.writeStackTrace) {
                try {
                    throw new Error(err.toString());
                }
                catch (e1) {
                    errStacks = e1['stacks'];
                }
            }
        }
        // complete log record:
        var logRecordStr = '[' + date.toJSON() + '] [' + errType + ']: ' + errMessage + "\n";
        // serialize stack trace info if necessary:
        if (this.writeStackTrace) {
            stackTrace = this.getStackTraceItems(errStacks);
            logRecordStr += this.serializeStackTrace(stackTrace) + "\n\n";
        }
        // write log record:
        return this.appendToLogFile(logRecordStr, level);
    };
    /**
     * @summary Log any stringified JS variable into log file with stack trace.
     * @param obj any JS variable to log.
     * @param level Log level (log file name).
     */
    Logger.prototype.Log = function (obj, level) {
        if (level === void 0) { level = 'debug'; }
        var date = new Date(), objSerialized, errStacks = [], stackTrace;
        // check if current log level is allowed:
        if (!this.allowedLevels.has(level) ||
            !this.allowedLevels.get(level))
            return this;
        // serialize given object:
        objSerialized = this.serializeWhatIsPossible(obj, this.writeStackTrace, true);
        // complete log record:
        var logRecordStr = '[' + date.toJSON() + '] ' + objSerialized + "\n";
        // serialize stack trace info if necessary:
        if (this.writeStackTrace) {
            // complete stack trace by dummy error:
            try {
                throw new Error('Place error.');
            }
            catch (e3) {
                if (e3.stack.length > 0) {
                    errStacks = e3['stacks'];
                    errStacks = errStacks.slice(1);
                }
            }
            stackTrace = this.getStackTraceItems(errStacks);
            logRecordStr += this.serializeStackTrace(stackTrace) + "\n\n";
        }
        // write log record:
        return this.appendToLogFile(logRecordStr, level);
    };
    Logger.prototype.appendToLogFile = function (msg, level) {
        var _this = this;
        var logFullPath = this.logsDirFullPath + '/' + level + Logger.LOGS_EXT;
        if (this.streamWriting) {
            console.log([this.logsStreamsLengths.get(level), this.maxLogFileSize, this.logsStreamsLengths.get(level) > this.maxLogFileSize]);
            if (this.logsStreamsLengths.has(level) && this.logsStreamsLengths.get(level) > this.maxLogFileSize) {
                if (!this.logsStreams.has(level)) {
                    // still renaming:
                    this.logsCaches.set(level, this.logsCaches.get(level) + msg);
                }
                else {
                    // begin rename:
                    this.logsCaches.set(level, msg);
                    var stream = this.logsStreams.get(level);
                    stream.end();
                    stream.close();
                    this.logsStreams.delete(level);
                    this.renameFullLogFile(level, function () {
                        _this.logsStreamsLengths.set(level, 0);
                        var msgLocal = _this.logsCaches.get(level);
                        _this.logsCaches.set(level, '');
                        _this.appendToLogFileByStream(msgLocal, level, logFullPath);
                    });
                }
            }
            else {
                this.appendToLogFileByStream(msg, level, logFullPath);
            }
        }
        else {
            fs_1.default.exists(logFullPath, function (exists) {
                if (!exists) {
                    _this.appendToLogFileByStandardWrite(msg, level, logFullPath);
                }
                else {
                    fs_1.default.stat(logFullPath, function (errLocal, stats) {
                        if (errLocal) {
                            _this.logsCaches.set(level, _this.logsCaches.get(level) + msg);
                            return console.log(errLocal);
                        }
                        if (stats.size > _this.maxLogFileSize) {
                            _this.renameFullLogFile(level, function () {
                                _this.logsStreamsLengths.set(level, 0);
                                var msgLocal = _this.logsCaches.get(level);
                                _this.logsCaches.set(level, '');
                                _this.appendToLogFileByStandardWrite(msgLocal, level, logFullPath);
                            });
                        }
                        else {
                            _this.appendToLogFileByStandardWrite(msg, level, logFullPath);
                        }
                    });
                }
            });
        }
        return this;
    };
    Logger.prototype.renameFullLogFile = function (level, cb) {
        var _this = this;
        var oldFullPath = this.logsDirFullPath + '/' + level + Logger.LOGS_EXT;
        fs_1.default.stat(oldFullPath, function (errLocal1, stats) {
            if (errLocal1)
                return console.error(errLocal1);
            var date = stats.ctime, newFileNameLevels = [
                // _2020-01-01:
                '_' + ([
                    date.getFullYear().toString(),
                    ((date.getMonth() + 1) / 100).toFixed(2).substr(2),
                    (date.getDate() / 100).toFixed(2).substr(2)
                ].join('-')),
                // _01-01
                '_' + ([
                    (date.getHours() / 100).toFixed(2).substr(2),
                    (date.getMinutes() / 100).toFixed(2).substr(2),
                    (date.getSeconds() / 100).toFixed(2).substr(2)
                ].join('-')),
                // _123
                [
                    '_',
                    (date.getMilliseconds() / 1000).toFixed(3).substr(2)
                ].join('')
            ];
            fs_1.default.readdir(_this.logsDirFullPath, function (errLocal2, files) {
                if (errLocal2)
                    return console.error(errLocal2);
                var newFileName = level;
                for (var i = 0, l = newFileNameLevels.length; i < l; i++) {
                    newFileName += newFileNameLevels[i];
                    if (files.indexOf(newFileName + Logger.LOGS_EXT) === -1)
                        break;
                }
                fs_1.default.rename(_this.logsDirFullPath + '/' + level + Logger.LOGS_EXT, _this.logsDirFullPath + '/' + newFileName + Logger.LOGS_EXT, function (errLocal3) {
                    if (errLocal3)
                        return console.error(errLocal3);
                    cb();
                });
            });
        });
    };
    Logger.prototype.appendToLogFileByStandardWrite = function (msg, level, logFullPath) {
        fs_1.default.appendFile(logFullPath, msg, function (errLocal) {
            if (errLocal)
                console.error(errLocal);
        });
    };
    Logger.prototype.appendToLogFileByStream = function (msg, level, logFullPath) {
        var _this = this;
        var stream;
        if (this.logsStreams.has(level)) {
            stream = this.logsStreams.get(level);
        }
        else {
            stream = fs_1.default.createWriteStream(logFullPath, {
                flags: 'a+',
                autoClose: false,
                encoding: 'utf8',
                mode: 438
            });
            this.logsStreams.set(level, stream);
            this.logsStreamsLengths.set(level, 0);
        }
        stream.write(msg, function (errLocal) {
            if (errLocal) {
                stream.end();
                stream.close();
                _this.logsStreams.delete(level);
                console.error(errLocal);
            }
            else {
                _this.logsStreamsLengths.set(level, _this.logsStreamsLengths.get(level) + Buffer.byteLength(msg, 'utf8'));
            }
        });
    };
    Logger.prototype.serializeStackTrace = function (items) {
        var result = [], item, fileLine;
        for (var i = 0, l = items.length; i < l; i++) {
            item = items[i];
            fileLine = '';
            if (!item.isNative && item.file !== '' && item.line.toString() !== '')
                fileLine = item.file + ':' + item.line.toString() + ':' + item.column.toString();
            result.push("\t-> " + item.fnFullName + '(' + item.argumentsSerialized + ');'
                + (fileLine.length > 0 ? "\n\t   " + fileLine : ""));
        }
        return result.join("\n");
    };
    Logger.prototype.getStackTraceItems = function (stacks) {
        var stackTraceItems = [];
        for (var i = 0, l = stacks.length; i < l; i++)
            stackTraceItems.push(this.getStackTraceItem(stacks[i]));
        return stackTraceItems;
    };
    Logger.prototype.getStackTraceItem = function (stack) {
        var isTopLevel, isConstructor, fnFullName, evalOrigin, fn, args = [], argsStr = '', file;
        // arguments:
        if (this.writeStackTraceFuncArgs) {
            fn = stack.getFunction();
            if (fn) {
                args = [];
                try {
                    args = fn.arguments ? [].slice.apply(fn.arguments) : [];
                }
                catch (e1) { }
                if (args.length > 0) {
                    argsStr = this.getStackTraceItemSerializedArgs(args);
                }
            }
        }
        // file:
        file = Boolean(stack.getScriptNameOrSourceURL)
            ? stack.getScriptNameOrSourceURL()
            : stack.getFileName();
        if (file) {
            file = file.replace(/\\/g, '/');
            if (file.indexOf(this.documentRoot) === 0)
                file = '.' + file.substr(this.documentRoot.length);
        }
        // eval origin file:
        evalOrigin = stack.getEvalOrigin();
        if (evalOrigin)
            evalOrigin = evalOrigin.replace(/\\/g, '/');
        // function full name:
        isTopLevel = stack.isToplevel();
        isConstructor = stack.isConstructor();
        fnFullName = this.getStackTraceItemFuncFullName(stack, isTopLevel, isConstructor);
        // return result:
        return {
            stack: stack,
            scope: stack.getThis(),
            fnFullName: fnFullName,
            isConstructor: isConstructor,
            isNative: stack.isNative(),
            isToplevel: isTopLevel,
            isEval: stack.isEval(),
            arguments: args,
            argumentsSerialized: argsStr,
            file: file,
            line: stack.getLineNumber(),
            column: stack.getColumnNumber(),
            evalOrigin: evalOrigin
        };
    };
    Logger.prototype.getStackTraceItemSerializedArgs = function (args) {
        var arg, result = [], separator = '';
        for (var j = 0, k = args.length; j < k; j++) {
            arg = args[j];
            result.push(separator);
            result.push(this.serializeWhatIsPossible(arg, false, false));
            separator = ',';
        }
        return result.join('');
    };
    Logger.prototype.serializeWhatIsPossible = function (obj, prettyPrint, addTypeName) {
        if (prettyPrint === void 0) { prettyPrint = false; }
        if (addTypeName === void 0) { addTypeName = true; }
        var result = [], separator = '', keys, key;
        if (helpers_1.Helpers.IsPrimitiveType(obj)) {
            result.push(JSON.stringify(obj));
        }
        else if (
        //Helpers.RealTypeOf(obj) == 'Array' | 'Uint8Array' | ... &&
        'length' in Object.getPrototypeOf(obj)) {
            result.push('[');
            for (var i = 0, l = obj.length; i < l; i++) {
                result.push(separator);
                try {
                    if (prettyPrint) {
                        result.push(JSON.stringify(obj[i], null, "\n"));
                    }
                    else {
                        result.push(JSON.stringify(obj[i]));
                    }
                }
                catch (e1) {
                    try {
                        result.push(v8_1.default.serialize(obj[i]).toString('base64'));
                    }
                    catch (e2) {
                        result.push(JSON.stringify('[' + helpers_1.Helpers.RealTypeOf(obj[i]) + ']'));
                    }
                }
                separator = ',';
            }
            result.push(']');
        }
        else {
            result.push('{');
            keys = Object.keys(obj);
            for (var j = 0, k = keys.length; j < k; j++) {
                key = keys[j];
                if (prettyPrint) {
                    result.push(separator + "\n\t" + JSON.stringify(key) + ":");
                }
                else {
                    result.push(separator + JSON.stringify(key) + ":");
                }
                try {
                    if (prettyPrint) {
                        result.push(JSON.stringify(obj[key], null, "\n"));
                    }
                    else {
                        result.push(JSON.stringify(obj[key]));
                    }
                }
                catch (e1) {
                    try {
                        result.push(v8_1.default.serialize(obj[key]).toString('base64'));
                    }
                    catch (e2) {
                        result.push(JSON.stringify('[' + helpers_1.Helpers.RealTypeOf(obj[key]) + ']'));
                    }
                }
                separator = ',';
            }
            if (prettyPrint) {
                result.push("\n}");
            }
            else {
                result.push('}');
            }
        }
        if (addTypeName)
            result.push(' [' + helpers_1.Helpers.RealTypeOf(obj) + ']');
        return result.join('');
    };
    Logger.prototype.getStackTraceItemFuncFullName = function (stack, isTopLevel, isConstructor) {
        var fnFullName, methodName, typeName;
        if (isTopLevel) {
            fnFullName = stack.getFunctionName();
        }
        else if (isConstructor) {
            fnFullName = stack.getTypeName() + '.constructor';
        }
        else {
            methodName = stack.getMethodName();
            typeName = stack.getTypeName();
            if (methodName == null && typeName !== null) {
                fnFullName = typeName + '.' + stack.getFunctionName();
            }
            else if (methodName !== null && typeName !== null) {
                fnFullName = typeName + '.' + methodName;
            }
            else {
                fnFullName = stack.getFunctionName();
            }
        }
        return fnFullName;
    };
    Logger.LEVEL = {
        CRITICIAL: 'critical',
        ERROR: 'error',
        WARNING: 'warning',
        NOTICE: 'notice',
        INFO: 'info',
        DEBUG: 'debug'
    };
    Logger.LOGS_EXT = '.log';
    Logger.instance = null;
    return Logger;
}());
exports.Logger = Logger;
;
//# sourceMappingURL=logger.js.map