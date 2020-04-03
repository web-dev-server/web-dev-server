import * as fs from "fs";

import {
	Server, Request, Response, Applications, Tools
} from "../../../lib/Server";


/**
 * @summary Exported class to handle directory requests.
 */
class App extends Applications.Abstract {
	
	/** 
	 * @summary Application constructor, which is executed only once, 
	 * 			when there is a request to directory with default `index.js`
	 * 			script inside. Then it's automatically created an instance 
	 * 			of `module.exports` content. Then it's executed 
	 * 			`handleHttpRequest` method on that instance. 
	 * 			This is the way, how is directory request handled with 
	 * 			default `index.js` file inside. 
	 * 			If there is detected any file change inside this file 
	 * 			(or inside file included in this file), the module 
	 * 			`web-deb-server` automaticly reloads all necesssary 
	 * 			dependent source codes and creates this application 
	 * 			instance again. The same realoding procedure is executed, 
	 * 			if there is any unhandled error inside method 
	 * 			`handleHttpRequest` (to develop more comfortably).
	 */
	public constructor (server: Server, request: Request, response: Response) {
		super(server);
		// Any initializations:
		
		request.GetPath();
		response.IsSentHeaders()
	}
	
	/** @summary Requests counter. */
	protected counter: number = 0;

	/**
	 * @summary This method is executed each request to directory with 
	 * 			`index.js` script inside (also executed for first time 
	 * 			immediately after constructor).
	 */
	public async ServerHandler(request: Request, response: Response): Promise<void> {

		// increase request counter:
		this.counter++;

		var sessionExists = Applications.Session.Exists(request);
		var sessionInitParam = request.GetParam('session_init', '\\d');
		if (!sessionExists) {
			if (!sessionInitParam) return response.Redirect('?session_init=1');
			(await Applications.Session.Start(request, response)).GetNamespace("test").value = 0;
			return response.Redirect(request.GetRequestUrl());
		}
		var session = await Applications.Session.Start(request, response);
		var sessionNamespace = session.GetNamespace("test").SetExpirationSeconds(30);
		sessionNamespace.value += 1;
		
		// some demo operation to say hallo world:
		var staticHtmlFileFullPath = this.server.GetDocumentRoot() + "/src/tests/assets/index.html";
		
		// try to uncomment line bellow to see rendered error in browser:
		//throw new Error("Uncatched test error 1.");

		//var data: string = await fs.promises.readFile(staticHtmlFileFullPath, 'utf8'); // experimental
		var data: string = await new Promise<string>((
			resolve: (data: string) => void, reject: (err: Error) => void
		) => {
			fs.readFile(staticHtmlFileFullPath, 'utf8', (err: Error, data: string) => {
				// try to uncomment line bellow to see rendered error in browser:
				try {
					//throw new Error("Uncatched test error 2.");
				} catch (e) {
					err = e;
				}
				if (err) return reject(err);
				resolve(data);
			});
		});

/*
		var qs = 'arr[]=1&arr[]=2&arr[]=3&obj[x1][y1]=a&obj[x1][y2]=aa&obj[x2][y1]=b&obj[x2][y2]=bb';
		var qs = 'obj[x2][y2]=bb&arr[]=1&arr[]=2';
		var qs = 'arr[]=1&arr[]=2&arr[]=3&obj[x1][y1][]=a&obj[x1][y2][]=aa&obj[x2][y1][]=b&obj[x2][y2][]=bb';
		var qs = 'arr[]=1&arr[]=2&arr[]=3&obj[][x1][y1]=a&obj[][x1][y2]=aa&obj[][x2][y1]=b&obj[][x2][y2]=bb';
*/
		
		response.SetBody(data.replace(
			/%code%/g, JSON.stringify({
				basePath: request.GetBasePath(),
				path: request.GetPath(),
				domainUrl: request.GetDomainUrl(),
				baseUrl: request.GetBaseUrl(),
				requestUrl: request.GetRequestUrl(),
				fullUrl: request.GetFullUrl(),
				params: request.GetParams(false, false),
				appRequests: this.counter,
				sessionTestValue: sessionNamespace.value
			}, null, "\t")
		)).Send();
	}
	
	
}

export default App;