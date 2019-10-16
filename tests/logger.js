var FileSystem = require('fs');

var Logger = function (dirFullPath) {
	dirFullPath = dirFullPath.replace(/\\/g, '/');
	this._errorLogFullPath = dirFullPath + '/errors.log';
	this._debugLogFullPath = dirFullPath + '/debug.log';
};
Logger.prototype = {
	Error: function (e) {
		if (typeof e === 'string') {
			try {
				throw new Error(e);
			} catch (e2) {
				e = e2;
			}
		}
		try {
			var stackTraceStr = e.stack.toString().replace(/\\/g, '/').replace(/\r/g, '');
			var stackTraceArr = this._completeStackTrace(stackTraceStr);
			var callersArgs = this._completeCallersArgs();
			stackTraceArr = this._assignCallersArgsToStackTraceItems(stackTraceArr, callersArgs);
			var stackStr = this._completeStackTraceWithArgs(stackTraceArr, e, true);
			var date = new Date();
			var errorString = '[' + date.toJSON() + '] ' + "\n" + stackStr + "\n\n";
			console.log(e);
			FileSystem.appendFile(this._errorLogFullPath, errorString, function (err) {
				if (err) throw err;
			});
		} catch (e3) {
			console.log(e3);
		}
	},
	Debug: function (obj) {
		var debugStr = '',
			err = { stack: '', message: '' };
		try {
			debugStr = JSON.stringify(obj, "\n", "\t", true);
		} catch (e1) {
			debugStr = obj.toString();
		}
		debugStr += ' [' + this._realTypeOf(obj) + ']';
		try {
			throw new Error('');
		} catch (e2) {
			err = e2;
		}
		var stackTraceStr = err.stack.toString().replace(/\\/g, '/').replace(/\r/g, '');
		var stackTraceArr = this._completeStackTrace(stackTraceStr);
		var callersArgs = this._completeCallersArgs();
		stackTraceArr = this._assignCallersArgsToStackTraceItems(stackTraceArr, callersArgs);
		var date = new Date();
		debugStr = '[' + date.toJSON() + '] ' + "\n" + debugStr + "\n"
			+ this._completeStackTraceWithArgs(stackTraceArr, err, false) + "\n\n";

		FileSystem.appendFile(this._debugLogFullPath, debugStr, function (errLocal) {
			if (errLocal) throw errLocal;
		});
	},
	_completeCallersArgs: function (e) {
		var argsItems = [],
			args = arguments.callee.caller.arguments,
			argsArr = [],
			cnt = 0;
		while (cnt++ < 10000) {
			if (
				typeof args !== 'undefined' &&
				args.callee &&
				args.callee.caller &&
				typeof args.callee.caller.arguments !== 'undefined'
			) {
				argsArr = [].slice.apply(args.callee.caller.arguments);
				for (var i = 0, l = argsArr.length; i < l; i++)
					if (typeof argsArr[i] === 'function')
						argsArr[i] = argsArr[i].toString();
				argsItems.push({
					fn: args.callee.caller.name,
					args: argsArr
				});
				args = args.callee.caller.arguments;
			} else {
				break;
			}
		}
		return argsItems;
	},
	_completeStackTrace: function (stackTraceStr) {
		var result = [],
			stackItem = '', fnName = '', lastFnName = 'throw new Error',
			file = '', line = '', column = '',
			fnNameAndPlace = [],
			fileLineAndColumn = [],
			rawFnNameAndPlace,
			rawFileLineAndColumn,
			stackItems = stackTraceStr.split("\n");
		stackItems.shift();
		for (var i = 0, l = stackItems.length; i < l; i++) {
			stackItem = stackItems[i];
			fnNameAndPlace = [];
			fileLineAndColumn = [];
			fnName = '';
			file = '';
			line = '';
			column = '';
			rawFnNameAndPlace = stackItem.replace(
				/^\s+at\s([^\(]+)\(([^\)]+)\)/g,
				function (wholeStr, group1, group2) {
					return JSON.stringify([group1.trim(), group2.trim()]);
				}
			);
			try {
				fnNameAndPlace = JSON.parse(rawFnNameAndPlace);
			} catch (e1) {
				fnNameAndPlace = ['', ''];
			}
			if (this._realTypeOf(fnNameAndPlace) === 'Array' && fnNameAndPlace.length > 0) {
				fnName = fnNameAndPlace[0];
				rawFileLineAndColumn = fnNameAndPlace[1].replace(
					/(.*)\:(\d+)\:(\d+)$/g,
					function (wholeStr, group1, group2, group3) {
						return JSON.stringify([String(group1).trim(), String(group2).trim(), String(group3).trim()]);
					}
				);
				try {
					fileLineAndColumn = JSON.parse(rawFileLineAndColumn);
				} catch (e2) {
					fileLineAndColumn = ['', '', ''];
				}
				if (this._realTypeOf(fileLineAndColumn) === 'Array' && fileLineAndColumn.length > 0) {
					file = fileLineAndColumn[0];
					line = fileLineAndColumn[1];
					column = fileLineAndColumn[2];
				}
			}
			if (fnName === 'Module._compile' && file === 'module.js') break;
			if (
				fnName === '' ||
				this._realTypeOf(fnName) === 'Undefined' ||
				this._realTypeOf(fnName) === 'Null'
			)
				fnName = '<anonymous>';
			result.push({
				fn: lastFnName,
				file: file,
				line: line,
				column: column
			});
			lastFnName = fnName;
		}
		return result;
	},
	_assignCallersArgsToStackTraceItems: function (stackTraceArr, callersArgs) {
		if (callersArgs.length > 0) {
			var stackTraceItem = {},
				callersArgsIndex = 0;
			for (var i = 0, l = stackTraceArr.length; i < l; i++) {
				stackTraceItem = stackTraceArr[i];
				callerArgItem = callersArgs[callersArgsIndex];
				if (stackTraceItem.fn.lastIndexOf(callerArgItem.fn) === stackTraceItem.fn.length - callerArgItem.fn.length) {
					stackTraceItem.args = callerArgItem.args;
					try {
						stackTraceItem.argsStr = JSON.stringify(callerArgItem.args);
					} catch (e1) {
						stackTraceItem.argsStr + '[';
						for (var j = 0, k = callerArgItem.args.length, separator = '', argItemInStr = ''; j < k; j += 1) {
							try {
								argItemInStr = JSON.stringify(callerArgItem.args[j]);
							} catch (e2) {
								argItemInStr = JSON.stringify(e2.message);
							}
							stackTraceItem.argsStr += separator + JSON.stringify(j) + ':' + argItemInStr;
							separator = ',';
						}
						stackTraceItem.argsStr += ']';
					}
					stackTraceItem.argsStr = stackTraceItem.argsStr.substr(1, stackTraceItem.argsStr.length - 2);
					if (stackTraceItem.argsStr === 'undefined') stackTraceItem.argsStr = '';
					callersArgsIndex += 1;
				} else {
					stackTraceItem.args = [];
					stackTraceItem.argsStr = '';
				}
				if (callersArgsIndex === callersArgs.length)
					break;
			}
		}
		return stackTraceArr;
	},
	_completeStackTraceWithArgs: function (stackTraceArr, err, errorHandling) {
		var stackTraceStrItems = [],
			stackTraceItem = {},
			fileLine = '';
		for (var i = 0, l = stackTraceArr.length; i < l; i++) {
			stackTraceItem = stackTraceArr[i];
			if (i === 0) {
				if (errorHandling) {
					stackTraceItem.argsStr = JSON.stringify(err.message);
				} else {
					continue;
				}
			}
			fileLine = '';
			if (stackTraceItem.file !== '' && stackTraceItem.line !== '')
				fileLine = stackTraceItem.file + ':' + stackTraceItem.line + ':' + stackTraceItem.column;
			stackTraceStrItems.push(
				"\t-> " + stackTraceItem.fn + '(' + stackTraceItem.argsStr + ');'
				+ (fileLine.length > 0 ? "\n\t   " + fileLine : "")
			);
		}
		return stackTraceStrItems.join("\n");
	},
	_realTypeOf: function (obj) {
		var s = Object.prototype.toString.apply(obj);
		return s.substr(8, s.length - 9);
	}
};
module.exports = Logger;
