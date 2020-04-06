

var WebDevServer = require("../../lib/Server");

var rootDir = __dirname + '/../../..';

var logger = WebDevServer.Tools.Logger.CreateNew(rootDir, rootDir)
				.SetStackTraceWriting(true, true);

WebDevServer.Server.CreateNew()
	.SetDocumentRoot(rootDir)
	.SetPort(8000)
	.SetHostname('web-dev-server.local')	// optional, localhost by default
	.SetDevelopment(true)
	//.SetBasePath('/node')
	.SetErrorHandler(async function (err, code, req, res) {
		console.error(err);
		logger.Error(err);
	})
	.AddPreHandler(async function (req, res, event) {
		if (req.GetPath() == '/health') {
			res.SetCode(200).SetBody('1').Send();
			event.PreventDefault();
		}
		/*setTimeout(function () {
			throw new Error("Test error:-)");
		}, 1000);*/
	})
	.Start();
