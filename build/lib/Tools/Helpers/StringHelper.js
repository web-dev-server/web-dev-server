Object.defineProperty(exports, "__esModule", { value: true });
var ObjectHelper_1 = require("./ObjectHelper");
var NumberHelper_1 = require("./NumberHelper");
var StringHelper = /** @class */ (function () {
    function StringHelper() {
    }
    StringHelper.Trim = function (str, chars) {
        var ch, newStr = '';
        for (var a = 0, b = chars.length; a < b; a++) {
            ch = chars.charAt(a);
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
        }
        return newStr;
    };
    StringHelper.TrimLeft = function (str, chars) {
        var ch, newStr = '';
        for (var a = 0, b = chars.length; a < b; a++) {
            ch = chars.charAt(a);
            for (var i = 0, l = str.length; i < l; i += 1) {
                if (str.charAt(i) == ch) {
                    newStr = str.substr(i + 1);
                }
                else {
                    newStr = str.substr(i);
                    break;
                }
            }
        }
        return newStr;
    };
    StringHelper.TrimRight = function (str, chars) {
        var ch, newStr = '';
        for (var a = 0, b = chars.length; a < b; a++) {
            ch = chars.charAt(a);
            for (var i = str.length - 1; i > -1; i -= 1) {
                if (str.charAt(i) == ch) {
                    newStr = str.substring(0, i);
                }
                else {
                    newStr = str.substring(0, i + 1);
                    break;
                }
            }
        }
        return newStr;
    };
    StringHelper.Strtr = function (str, dic) {
        var makeToken = function (inx) { return "{{###~" + inx + "~###}}"; }, tokens = Object.keys(dic).map(function (key, inx) { return ({
            key: key,
            val: dic[key],
            token: makeToken(inx)
        }); }), tokenizedStr = tokens.reduce(function (carry, entry) { return carry ? carry.replace(entry.key, entry.token) : carry; }, str);
        return tokens.reduce(function (carry, entry) { return carry ? carry.replace(entry.token, entry.val) : carry; }, tokenizedStr);
    };
    /**
     * Convert special characters to HTML entities except ampersand `&`.
     * @see http://php.net/manual/en/function.htmlspecialchars.php
     * @param str
     */
    StringHelper.HtmlSpecialChars = function (str, includeAmpersand) {
        if (includeAmpersand === void 0) { includeAmpersand = true; }
        if (includeAmpersand)
            return StringHelper.Strtr(str, this.HTML_SPECIAL_CHARS);
        return StringHelper.Strtr(str, this.HTML_SPECIAL_CHARS_WITHOUT_AMP);
    };
    StringHelper.HtmlEntitiesEncode = function (rawStr) {
        return rawStr.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
    };
    StringHelper.RawUrlDecode = function (str) {
        return decodeURIComponent((str + '')
            .replace(/%(?![\da-f]{2})/gi, function () {
            // PHP tolerates poorly formed escape sequences
            return '%25';
        }));
    };
    StringHelper.QueryStringEncode = function (obj, encodeAmp) {
        if (encodeAmp === void 0) { encodeAmp = false; }
        var items = [];
        this.encodeQueryStringRecursive('', [], obj, items, 0);
        return items.join(encodeAmp ? '&amp;' : '&');
    };
    StringHelper.encodeQueryStringRecursive = function (prefix, keys, value, items, level) {
        var _this = this;
        var result, keysClone, keyStr, objKeys, protoName;
        if (ObjectHelper_1.ObjectHelper.IsPrimitiveType(value)) {
            result = prefix;
            if (keys.length > 0)
                result += '[' + keys.join('][') + ']';
            result += '=';
            if (value != null)
                result += encodeURIComponent(String(value));
            items.push(result);
        }
        else if (value instanceof Map) {
            value.forEach(function (valueLocal, keyLocal) {
                keysClone = [].concat(keys);
                keysClone.push(encodeURIComponent(keyLocal));
                _this.encodeQueryStringRecursive(prefix, keysClone, valueLocal, items, level + 1);
            });
        }
        else if (value instanceof Set) {
            value.forEach(function (valueLocal) {
                keysClone = [].concat(keys);
                keysClone.push('');
                _this.encodeQueryStringRecursive(prefix, keysClone, valueLocal, items, level + 1);
            });
        }
        else {
            protoName = ObjectHelper_1.ObjectHelper.RealTypeOf(value);
            if (protoName.indexOf('Array') != -1) {
                for (var i = 0, l = value['length']; i < l; i++) {
                    keysClone = [].concat(keys);
                    keysClone.push('');
                    this.encodeQueryStringRecursive(prefix, keysClone, value[i], items, level + 1);
                }
            }
            else {
                objKeys = Object.keys(value);
                for (var i = 0, l = objKeys.length; i < l; i++) {
                    keyStr = objKeys[i];
                    keysClone = [].concat(keys);
                    if (level === 0) {
                        prefix = encodeURIComponent(keyStr);
                    }
                    else {
                        keysClone.push(encodeURIComponent(keyStr));
                    }
                    this.encodeQueryStringRecursive(prefix, keysClone, value[keyStr], items, level + 1);
                }
            }
        }
    };
    StringHelper.QueryStringDecode = function (queryString, decodeAmp) {
        if (decodeAmp === void 0) { decodeAmp = true; }
        if (decodeAmp)
            while (queryString.match(/&amp;/g))
                queryString = queryString.replace(/&amp;/g, '&');
        queryString = this.Trim(queryString, '&');
        var result = [], items = queryString.split('&'), allObjectLevels = [], objectLevels, objectLevel, levelKey, levelValueToRetype;
        for (var i = 0, l = items.length; i < l; i++) {
            objectLevels = this.qsDecodeItem(result, items[i]);
            if (objectLevels == null)
                continue;
            allObjectLevels = [].concat(allObjectLevels, objectLevels);
        }
        allObjectLevels = allObjectLevels.sort(function (a, b) {
            return a.index - b.index;
        });
        var rootMatched = false;
        for (var i = allObjectLevels.length - 1; i >= 0; i--) {
            objectLevel = allObjectLevels[i];
            if (objectLevel.index === 0) {
                rootMatched = true;
                continue;
            }
            levelKey = objectLevel.key;
            levelValueToRetype = objectLevel.level[levelKey];
            if (levelValueToRetype instanceof Array)
                objectLevel.level[levelKey] = this.qsRetypeToObject(levelValueToRetype);
        }
        if (rootMatched && result instanceof Array)
            result = this.qsRetypeToObject(result);
        return result;
    };
    StringHelper.qsDecodeItem = function (result, item) {
        var pos = item.indexOf('=');
        if (pos == -1) {
            result[item] = true;
            return null;
        }
        var rawName = item.substr(0, pos), rawValue = item.substr(pos + 1), nameLevels = [];
        rawName = this.qsDecodeGetVarNameLevels(rawName, nameLevels);
        if (rawName == 'push')
            return null;
        var value = this.qsDecodeGetValue(rawValue), objectLevels = this.qsDecodeValueToLevel(result, rawName, nameLevels, value);
        if (objectLevels.length > 0)
            return objectLevels;
        return null;
    };
    StringHelper.qsDecodeGetVarNameLevels = function (rawName, nameLevels) {
        var openPos, closePos, nameLevelValue;
        while (true) {
            closePos = rawName.lastIndexOf(']', rawName.length);
            if (closePos == -1 && closePos != rawName.length - 1)
                break;
            openPos = rawName.lastIndexOf('[', closePos);
            if (openPos == -1)
                break;
            nameLevelValue = rawName.substr(openPos + 1, closePos - openPos - 1);
            nameLevels.push({
                value: nameLevelValue,
                implicitIndex: Boolean(nameLevelValue === '')
            });
            rawName = rawName.substr(0, openPos);
            if (rawName.length === 0)
                break;
        }
        nameLevels.reverse();
        return rawName;
    };
    StringHelper.qsDecodeGetValue = function (rawValue) {
        var value;
        try {
            value = JSON.parse(rawValue);
        }
        catch (e) {
            value = rawValue;
        }
        return value;
    };
    StringHelper.qsDecodeValueToLevel = function (result, rawName, nameLevels, value) {
        var lastLocalLevelValue, localLevelValue, nameLevel, nameLevelKey, lastNameLevelKey, objectLevels = [];
        if (rawName === '' || !NumberHelper_1.NumberHelper.IsNumeric(rawName))
            objectLevels.push({
                level: result,
                index: 0
            });
        if (nameLevels.length === 0) {
            if (result[rawName] == null) {
                result[rawName] = value;
            }
            else if (result[rawName] instanceof Array) {
                result[rawName].push(value);
            }
            else {
                result[rawName] = [result[rawName], value];
            }
            return objectLevels;
        }
        if (result[rawName] == null)
            result[rawName] = [];
        lastLocalLevelValue = result;
        lastNameLevelKey = rawName;
        localLevelValue = result[rawName];
        for (var j = 0, k = nameLevels.length; j < k; j++) {
            nameLevel = nameLevels[j];
            if (j + 1 === k) {
                // set last level
                if (nameLevel.implicitIndex) {
                    localLevelValue.push(value);
                }
                else {
                    nameLevelKey = nameLevel.value;
                    if (nameLevelKey == 'push')
                        continue;
                    if (localLevelValue instanceof Array)
                        objectLevels.push({
                            level: lastLocalLevelValue,
                            key: lastNameLevelKey,
                            index: j + 1
                        });
                    if (localLevelValue[nameLevelKey] == null) {
                        localLevelValue[nameLevelKey] = value;
                    }
                    else if (ObjectHelper_1.ObjectHelper.IsPrimitiveType(localLevelValue[nameLevelKey])) {
                        localLevelValue[nameLevelKey] = [localLevelValue[nameLevelKey], value];
                    }
                    else {
                        localLevelValue[nameLevelKey] = value;
                    }
                }
            }
            else {
                // get next level
                if (nameLevel.implicitIndex) {
                    if (localLevelValue.length === 0)
                        localLevelValue.push([]);
                    if (ObjectHelper_1.ObjectHelper.IsPrimitiveType(localLevelValue[localLevelValue.length - 1]))
                        localLevelValue.push([]);
                    lastLocalLevelValue = localLevelValue;
                    lastNameLevelKey = String(localLevelValue.length - 1);
                    localLevelValue = localLevelValue[localLevelValue.length - 1];
                }
                else {
                    nameLevelKey = nameLevel.value;
                    if (nameLevelKey == 'push')
                        continue;
                    if (localLevelValue[nameLevelKey] == null) {
                        localLevelValue[nameLevelKey] = [];
                    }
                    else if (ObjectHelper_1.ObjectHelper.IsPrimitiveType(localLevelValue[nameLevelKey])) {
                        localLevelValue[nameLevelKey] = [localLevelValue[nameLevelKey]];
                    }
                    if (localLevelValue instanceof Array)
                        objectLevels.push({
                            level: lastLocalLevelValue,
                            key: lastNameLevelKey,
                            index: j + 1
                        });
                    lastLocalLevelValue = localLevelValue;
                    lastNameLevelKey = nameLevelKey;
                    localLevelValue = localLevelValue[nameLevelKey];
                }
            }
        }
        return objectLevels;
    };
    StringHelper.qsRetypeToObject = function (arr) {
        var obj = {}, key, keys = Object.keys(arr);
        for (var i = 0, l = keys.length; i < l; i++) {
            key = keys[i];
            obj[key] = arr[key];
        }
        return obj;
    };
    /**
     * Recognize if given string is JSON or not without JSON parsing.
     * @see https://www.ietf.org/rfc/rfc4627.txt
     * @param jsonStr
     * @return bool
     */
    StringHelper.IsJsonString = function (jsonStr) {
        var match = jsonStr
            .replace(/"(\.|[^\\"])*"/g, '')
            .match(/[^\,\:\{\}\[\]0-9\.\\\-\+Eaeflnr-u \n\r\t]/g);
        return !Boolean(match && match.length > 0);
    };
    /**
     * Recognize if given string is query string without parsing.
     * It recognizes query strings like:
     * - `key1=value1`
     * - `key1=value1&`
     * - `key1=value1&key2=value2`
     * - `key1=value1&key2=value2&`
     * - `key1=&key2=value2`
     * - `key1=value&key2=`
     * - `key1=value&key2=&key3=`
     * ...
     * @param jsonStr
     */
    StringHelper.IsQueryString = function (queryStr) {
        var queryStr = this.Trim(this.Trim(queryStr, '='), '&');
        var apmsCount = queryStr.split('&').length - 1;
        var equalsCount = queryStr.split('=').length - 1;
        var firstAndLast = queryStr.substr(0, 1) + queryStr.substr(-1, 1);
        if (firstAndLast === '{}' || firstAndLast === '[]')
            return false; // most likely a JSON
        if (apmsCount === 0 && equalsCount === 0)
            return false; // there was `nothing`
        if (equalsCount > 0)
            equalsCount -= 1;
        if (equalsCount === 0)
            return true; // there was `key=value`
        return apmsCount / equalsCount >= 1; // there was `key=&key=value`
    };
    StringHelper.HTML_SPECIAL_CHARS = {
        '"': '&quot;',
        "'": '&apos;',
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
    };
    StringHelper.HTML_SPECIAL_CHARS_WITHOUT_AMP = {
        '"': '&quot;',
        "'": '&apos;',
        '<': '&lt;',
        '>': '&gt;',
    };
    return StringHelper;
}());
exports.StringHelper = StringHelper;
//# sourceMappingURL=StringHelper.js.map