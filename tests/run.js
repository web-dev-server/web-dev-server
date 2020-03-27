var Logger = require("./logger");
var loggerInstance = new Logger(__dirname);

var Test = function (a, b, c) {
	this.a = a;
	this.b = b;
	this.c = c;
	this.InstanceMethod(a, b, c);
};
Test.prototype.InstanceMethod = function (a, b, c) {
	throw new Error("Test error message.");
};
Test.CreateNew = function (a, b, c) {
	var t = new Test(a, b, c);
};

function test(a, b, c){
	try{
		Test.CreateNew(a, b, c);
	} catch(e){
		//loggerInstance.Error(e);
		console.log(e.stack);
		console.log(e.stacks);
	}
}

var start = function () {
	setTimeout(() => {
		test("a", "b", "c");
	}, 1000);
};
start();



/*
var WebDevServer = require("../build/server");

var Logger = require("./logger");
var loggerInstance = new Logger(__dirname);

WebDevServer.Server.CreateNew()
	.SetDocumentRoot(__dirname + '/..')		// required
	.SetPort(8000)							// optional, 8000 by default
	.SetDomain('127.0.0.1')					// optional, localhost by default
	//.SetDevelopment(false)				// optional, true by default to display Errors and directory content
	//.SetBasePath('/node')					// optional, null by default, useful for apache proxy modes
	.SetErrorHandler((e,code,req,res) => {	// optional, custom place to log any unhandled errors and warnings
		loggerInstance.Error(e);
	})
	.AddHandler(function (req, res, e, cb) {	// optional, to prepend any execution before `web-dev-server` module execution
		if (req.url == '/health') {
			res.writeHead(200);
			res.end('1');
			e.PreventDefault();		// do not anything else in `web-dev-server` module for this request
		}
		setTimeout(function () {
			throw new Error("Test error:-)");
		}, 1000);
		cb();
	})
	.Run();
*/