Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var url_1 = require("url");
var StringHelper_1 = require("../Tools/Helpers/StringHelper");
var Protected_1 = require("./Protected");
var Params = /** @class */ (function () {
    function Params() {
    }
    Params.prototype.IsCompleted = function () {
        var httpReq = this['http'];
        return httpReq.complete;
    };
    Params.prototype.LoadBody = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var httpReq;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                httpReq = this['http'];
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (httpReq.complete)
                            resolve(_this.body);
                        httpReq.on('body-loaded', function () {
                            resolve(_this.body);
                        });
                    })];
            });
        });
    };
    Params.prototype.SetParams = function (params) {
        this.params = params;
        return this;
    };
    Params.prototype.GetParams = function (nameReplaceFilter, valueReplaceFilter, onlyNames) {
        if (nameReplaceFilter === void 0) { nameReplaceFilter = "\-\._a-zA-Z0-9"; }
        if (valueReplaceFilter === void 0) { valueReplaceFilter = { pattern: /[\<\>\'"]/g, replace: '' }; }
        if (onlyNames === void 0) { onlyNames = []; }
        if (this.params == null)
            this.initParams();
        var result = {}, cleanedName, noNameFiltering = !nameReplaceFilter || nameReplaceFilter === '.*', noValueFiltering = !valueReplaceFilter || valueReplaceFilter === '.*';
        if (noNameFiltering && noValueFiltering) {
            if (onlyNames.length > 0) {
                for (var name in this.params) {
                    if (onlyNames.indexOf(name) != -1)
                        result[name] = this.params[name];
                }
            }
            else {
                result = this.params;
            }
            return result;
        }
        for (var name in this.params) {
            cleanedName = noNameFiltering
                ? name
                : Protected_1.Protected.CleanParamValue(name, nameReplaceFilter);
            result[cleanedName] = noValueFiltering
                ? this.params[name]
                : Protected_1.Protected.GetParamFromCollection(this.params, name, nameReplaceFilter, valueReplaceFilter, null);
        }
        return result;
    };
    Params.prototype.SetParam = function (name, value) {
        if (this.params == null)
            this.initParams();
        this.params[name] = value;
        return this;
    };
    Params.prototype.GetParam = function (name, valueReplaceFilter, ifNullValue) {
        if (valueReplaceFilter === void 0) { valueReplaceFilter = "a-zA-Z0-9_;, /\-\@\:"; }
        if (ifNullValue === void 0) { ifNullValue = null; }
        if (this.params == null)
            this.initParams();
        return Protected_1.Protected.GetParamFromCollection(this.params, name, false, valueReplaceFilter, ifNullValue);
    };
    Params.prototype.RemoveParam = function (name) {
        if (this.params == null)
            this.initParams();
        delete this.params[name];
        return this;
    };
    Params.prototype.HasParam = function (name) {
        if (this.params == null)
            this.initParams();
        return name in this.params;
    };
    /**
     * Initialize params from GET (or also from post, if request is already completed).
     */
    Params.prototype.initParams = function () {
        var httpReq = this['http'], postParams, getParams, method;
        try {
            var queryString = this['GetQuery'](false, true), getParams = StringHelper_1.StringHelper.QueryStringDecode(queryString, true);
        }
        catch (e) {
            var parsedUrlWithJsonQuery = url_1.parse(this['_url'], true), getParams = parsedUrlWithJsonQuery.query;
        }
        this.params = getParams;
        if (!httpReq.complete)
            return;
        method = httpReq.method.toUpperCase();
        if (method != 'POST' && method != 'PUT')
            return;
        postParams = this.initParamsCompletePostData();
        if (postParams == null)
            return;
        for (var key in postParams)
            this.params[key] = postParams[key];
    };
    /**
     * Read and return unserialized POST/PUT request body.
     */
    Params.prototype.initParamsCompletePostData = function () {
        if (this.body == null)
            return null;
        var result = null;
        var rawInput = this.body;
        // try first JSON decoding, then fallback to query string
        var probablyAJsonType = !StringHelper_1.StringHelper.IsQueryString(rawInput);
        if (probablyAJsonType) {
            try {
                result = JSON.parse(rawInput);
            }
            catch (e) {
                probablyAJsonType = false; // fall back to query string parsing
            }
        }
        if (!probablyAJsonType) {
            try {
                result = StringHelper_1.StringHelper.QueryStringDecode(rawInput, true);
            }
            catch (e) {
                rawInput = 'http://localhost/?' + StringHelper_1.StringHelper.TrimLeft(StringHelper_1.StringHelper.Trim(rawInput, '&='), '');
                var parsedBodyAsJsonQuery = url_1.parse(rawInput, true);
                if (parsedBodyAsJsonQuery && parsedBodyAsJsonQuery.query)
                    result = parsedBodyAsJsonQuery.query;
                if (parsedBodyAsJsonQuery && parsedBodyAsJsonQuery.query)
                    result = parsedBodyAsJsonQuery.query;
            }
        }
        return result;
    };
    return Params;
}());
exports.Params = Params;
//# sourceMappingURL=Params.js.map