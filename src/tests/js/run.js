//var WebDevServer = require("../build/server");

import * as WebDevServer from "../lib/Server"

var rootDir = __dirname + '/..';

/*var loggerInstance = WebDevServer.Logger.CreateNew(
	rootDir, rootDir
).SetStackTraceWriting(true, true);*/

WebDevServer.Server.CreateNew()
	.SetDocumentRoot(rootDir)						// required
	.SetPort(8000)									// optional, 8000 by default
	.SetHostname('note-tests.local')				// optional, localhost by default
	//.SetDevelopment(false)						// optional, true by default to display Errors and directory content
	//.SetBasePath('/node')							// optional, null by default, useful for apache proxy modes
	.SetErrorHandler(async (
		err: Error,
		code: number,
		req: WebDevServer.Request,
		res: WebDevServer.Response
	) => {	// optional, custom place to log any unhandled errors and warnings
		console.error(err);
		//loggerInstance.Error(err);
	})
	.AddPreHandler(async (
		req: WebDevServer.Request,
		res: WebDevServer.Response,
		event: WebDevServer.Event
	) => {	// optional, to prepend any execution before `web-dev-server` module execution
		// TODO
		/*if (req.GetUrl() == '/health') {
			res.writeHead(200);
			res.end('1');
			event.PreventDefault();					// do not anything else in `web-dev-server` module for this request
		}*/
		/*setTimeout(function () {
			throw new Error("Test error:-)");
		}, 1000);*/
	})
	.Run();
