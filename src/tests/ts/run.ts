import { Server, Request, Response, Session, Event, Tools } from "../../lib/Server";

var rootDir = __dirname + '/../../..';

var logger = Tools.Logger.CreateNew(rootDir, rootDir)
				.SetStackTraceWriting(true, true);

var customStore: Map<string, Session> = new Map<string, Session>();
var delayedWriting: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();
Session.SetLoadHandler(async (id: string, store: Map<string, Session>, exists: boolean): Promise<void> => {
	store.set(id, null);
	await new Promise<void>((resolve, reject) => {
		setTimeout(() => {
			//console.log("session load from external storrage...");
			if (customStore.has(id)) {
				store.set(id, customStore.get(id));
			} else if (exists) {
				store.delete(id);
			} else {
				var newSession = new Session(id, false);
				store.set(id, newSession);
			}
			resolve();
		}, 100);
	});
});
Session.SetWriteHandler(async (id: string, store: Map<string, Session>): Promise<void> => {
	var timeoutId: NodeJS.Timeout;
	if (delayedWriting.has(id)) {
		timeoutId = delayedWriting.get(id);
		clearTimeout(timeoutId);
	}
	timeoutId = setTimeout(() => {
		delayedWriting.delete(id);
		//console.log("session write into external storrage...");
		customStore.set(id, store.get(id));
	}, 5000);
	delayedWriting.set(id, timeoutId);
});

Server.CreateNew()
	.SetDocumentRoot(rootDir)
	.SetPort(8000)
	.SetHostname('web-dev-server.local')	// optional, localhost by default
	.SetDevelopment(true)
	//.SetBasePath('/node')
	.SetErrorHandler(async (
		err: Error,
		code: number,
		req: Request,
		res: Response
	) => {
		console.error(err);
		logger.Error(err);
	})
	.AddPreHandler(async (
		req: Request,
		res: Response,
		event: Event
	) => {
		if (req.GetPath() == '/health') {
			res.SetCode(200).SetBody('1').Send();
			event.PreventDefault();
		}
		/*setTimeout(function () {
			throw new Error("Test error:-)");
		}, 1000);*/
	})
	.Start();
