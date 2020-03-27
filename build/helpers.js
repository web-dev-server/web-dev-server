Object.defineProperty(exports, "__esModule", { value: true });
var server_1 = require("./server");
var DirItem = /** @class */ (function () {
    function DirItem(type, path, code) {
        this.type = type;
        this.path = path;
        this.code = code;
    }
    DirItem.TYPE_UNKNOWN = 0;
    DirItem.TYPE_DIR = 1;
    DirItem.TYPE_FILE = 2;
    DirItem.TYPE_SYMLINK = 4;
    DirItem.TYPE_SOCKET = 8;
    DirItem.TYPE_BLOCK_DEVICE = 16;
    DirItem.TYPE_CHARACTER_DEVICE = 32;
    DirItem.TYPE_FIFO = 64;
    return DirItem;
}());
exports.DirItem = DirItem;
var Helpers = /** @class */ (function () {
    function Helpers() {
    }
    Helpers.FormatDate = function (date) {
        return date.getFullYear() +
            '-' + ((date.getMonth() + 1) / 100).toFixed(2).substr(2) +
            '-' + (date.getDate() / 100).toFixed(2).substr(2) +
            '&nbsp;' + (date.getHours() / 100).toFixed(2).substr(2) +
            ':' + (date.getMinutes() / 100).toFixed(2).substr(2) +
            ':' + (date.getSeconds() / 100).toFixed(2).substr(2) +
            '.' + (date.getMilliseconds() / 1000).toFixed(3).substr(2);
    };
    Helpers.PaddingNumber = function (number, length, char) {
        if (length === void 0) { length = 2; }
        if (char === void 0) { char = '0'; }
        var result = number.toFixed(0);
        for (var i = 2, l = length + 1; i < l; i++) // 2 => 2; 3 => 2,3; 4 => 2,3,4; ...
            if (number < Math.pow(10, i - 1)) // 2 => 10; 3 => 10,100; 4 => 10,100,1000; ...
                result = char + result;
        return result;
    };
    Helpers.FormatFileSize = function (bytes) {
        var u = -1, units = server_1.Server.FILE_SIZE.UNITS, thresh = server_1.Server.FILE_SIZE.THRESH;
        if (Math.abs(bytes) < thresh)
            return bytes + ' B';
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[u];
    };
    Helpers.Trim = function (str, ch) {
        var newStr = '';
        for (var i = 0, l = str.length; i < l; i += 1) {
            if (str.charAt(i) == ch) {
                newStr = str.substr(i + 1);
            }
            else {
                newStr = str.substr(i);
                break;
            }
        }
        str = newStr;
        for (var i = str.length - 1; i > -1; i -= 1) {
            if (str.charAt(i) == ch) {
                newStr = str.substring(0, i);
            }
            else {
                newStr = str.substring(0, i + 1);
                break;
            }
        }
        return newStr;
    };
    Helpers.TrimLeft = function (str, ch) {
        var newStr = '';
        for (var i = 0, l = str.length; i < l; i += 1) {
            if (str.charAt(i) == ch) {
                newStr = str.substr(i + 1);
            }
            else {
                newStr = str.substr(i);
                break;
            }
        }
        return newStr;
    };
    Helpers.TrimRight = function (str, ch) {
        var newStr = '';
        for (var i = str.length - 1; i > -1; i -= 1) {
            if (str.charAt(i) == ch) {
                newStr = str.substring(0, i);
            }
            else {
                newStr = str.substring(0, i + 1);
                break;
            }
        }
        return newStr;
    };
    Helpers.HtmlEntitiesEncode = function (rawStr) {
        return rawStr.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
    };
    Helpers.RealTypeOf = function (obj) {
        var proto = Object.getPrototypeOf(obj);
        if (proto && proto.constructor) {
            return proto.constructor.name;
        }
        else {
            var s = Object.prototype.toString.apply(obj);
            return s.substr(8, s.length - 9);
        }
    };
    Helpers.IsPrimitiveType = function (obj) {
        return (obj !== Object(obj));
    };
    Helpers.GetRequireCacheDifferenceKeys = function (cacheKeysBeforeRequire, cacheKeysAfterRequire, requiredBy, doNotIncludePath) {
        var result = [], record;
        for (var i = 0, l = cacheKeysAfterRequire.length; i < l; i += 1) {
            record = cacheKeysAfterRequire[i];
            if (cacheKeysBeforeRequire.indexOf(record) == -1)
                if (record !== requiredBy && record.indexOf(doNotIncludePath) !== 0)
                    result.push(record);
        }
        return result;
    };
    Helpers.ObjectsArraySortByPathProperty = function (a, b) {
        if (a.path < b.path) {
            return -1;
        }
        else if (a.path > b.path) {
            return 1;
        }
        else {
            return 0;
        }
    };
    Helpers.ObjectToMap = function (obj) {
        var result = new Map();
        Object.keys(obj).forEach(function (key) {
            result.set(key, obj[key]);
        });
        return result;
    };
    /**
     * @summary Return found index JS stripts for server side  execution or index HTML static files.
     */
    Helpers.FindIndexInDirectory = function (dirItems, indexScripts, indexFiles) {
        var dirItemsLowerCased = [], indexFilesFound = [], indexScriptsFound = [], dirItem = '', dirItemLowerCased = '', resultScripts = [], resultFiles = [], i, l, index = 0;
        for (i = 0, l = dirItems.length; i < l; i++) {
            dirItem = dirItems[i];
            dirItemLowerCased = dirItem.toLowerCase();
            dirItemsLowerCased.push({
                original: dirItem,
                lowerCase: dirItemLowerCased
            });
            if (indexScripts.has(dirItemLowerCased)) {
                index = indexScripts.get(dirItemLowerCased);
                indexScriptsFound.push({
                    index: index,
                    dir: dirItem
                });
                break;
            }
        }
        if (indexScriptsFound.length > 0) {
            indexScriptsFound.sort(Helpers.indexScriptsFoundSort);
            indexScriptsFound.map(function (item) {
                resultScripts.push(item.dir);
            });
        }
        else {
            for (i = 0, l = dirItemsLowerCased.length; i < l; i++) {
                dirItem = dirItemsLowerCased[i].original;
                dirItemLowerCased = dirItemsLowerCased[i].lowerCase;
                if (indexFiles.has(dirItemLowerCased)) {
                    index = indexFiles.get(dirItemLowerCased);
                    indexFilesFound.push({
                        index: index,
                        file: dirItem
                    });
                }
            }
            indexFilesFound.sort(Helpers.indexFilesFoundSort);
            indexFilesFound.map(function (item) {
                resultFiles.push(item.file);
            });
        }
        ;
        return {
            scripts: resultScripts,
            files: resultFiles
        };
    };
    Helpers.indexScriptsFoundSort = function (a, b) {
        var ai = a.index;
        var bi = b.index;
        return (ai > bi) ? 1 : (ai < bi ? -1 : 0);
    };
    Helpers.indexFilesFoundSort = function (a, b) {
        var ai = a.index;
        var bi = b.index;
        return (ai > bi) ? 1 : (ai < bi ? -1 : 0);
    };
    return Helpers;
}());
exports.Helpers = Helpers;
//# sourceMappingURL=helpers.js.map