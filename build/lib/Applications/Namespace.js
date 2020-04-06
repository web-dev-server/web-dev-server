Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ApplicationInterfaces = tslib_1.__importStar(require("./IApplication"));
var Session_1 = require("./Session");
var Applications;
(function (Applications) {
    var Session = /** @class */ (function (_super) {
        tslib_1.__extends(Session, _super);
        function Session() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Session;
    }(Session_1.Session));
    Applications.Session = Session;
    ;
})(Applications = exports.Applications || (exports.Applications = {}));
(function (Applications) {
    var Session;
    (function (Session) {
        ;
    })(Session = Applications.Session || (Applications.Session = {}));
})(Applications = exports.Applications || (exports.Applications = {}));
(function (Applications) {
    var IAplication;
    (function (IAplication) {
        IAplication.IApplicationConstructor = ApplicationInterfaces.IApplicationConstructor;
    })(IAplication = Applications.IAplication || (Applications.IAplication = {}));
})(Applications = exports.Applications || (exports.Applications = {}));
//# sourceMappingURL=Namespace.js.map