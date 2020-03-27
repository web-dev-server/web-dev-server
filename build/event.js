Object.defineProperty(exports, "__esModule", { value: true });
var Event = /** @class */ (function () {
    function Event(req, res, cb, fullPath) {
        this.preventDefault = false;
        this.req = req;
        this.res = res;
        this.cb = cb;
        this.fullPath = fullPath;
    }
    Event.prototype.PreventDefault = function () {
        this.preventDefault = true;
        return this;
    };
    Event.prototype.IsPreventDefault = function () {
        return this.preventDefault;
    };
    return Event;
}());
exports.Event = Event;
//# sourceMappingURL=event.js.map