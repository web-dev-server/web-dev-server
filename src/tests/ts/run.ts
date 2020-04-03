import { Server, Request, Response, Event, Tools } from "../../lib/Server";

var rootDir = __dirname + '/../../..';

var logger = Tools.Logger.CreateNew(rootDir, rootDir)
				.SetStackTraceWriting(true, true);

Server.CreateNew()
	.SetDocumentRoot(rootDir)				// required
	.SetPort(8000)							// optional, 8000 by default
	.SetHostname('web-dev-server.local')	// optional, localhost by default
	.SetDevelopment(true)					// optional, true by default to display Errors and directory content
	//.SetBasePath('/node')					// optional, null by default, useful for apache proxy modes
	.SetErrorHandler(async (
		err: Error,
		code: number,
		req: Request,
		res: Response
	) => {	// optional, custom place to log any unhandled errors and warnings
		console.error(err);
		logger.Error(err);
	})
	.AddPreHandler(async (
		req: Request,
		res: Response,
		event: Event
	) => {	// optional, to prepend any execution before `web-dev-server` module execution
		if (req.GetPath() == '/health') {
			res.SetCode(200).SetBody('1').Send();
			event.PreventDefault();	// do not anything else in `web-dev-server` module for this request
		}
		/*setTimeout(function () {
			throw new Error("Test error:-)");
		}, 1000);*/
	})
	.Run();
