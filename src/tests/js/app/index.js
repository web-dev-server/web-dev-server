import * as fs from "fs";

import * as WebDevServer from "../../lib/Server";


/**
 * @summary Exported class to handle directory requests.
 */
class App extends WebDevServer.Applications.Abstract {
	
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
	public constructor (
		server: WebDevServer.Server, 
		request: WebDevServer.Request, 
		response: WebDevServer.Response
	) {
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
	public async ServerHandler(
		request: WebDevServer.Request, 
		response: WebDevServer.Response
	): Promise<void> {

		// increase request counter:
		this.counter++;
		
		// some demo operation to say hallo world:
		var staticHtmlFileFullPath = __dirname + '/../../../src/tests/app/index.html';
		
		// try to uncomment line bellow to see rendered error in browser:
		//throw new Error("Uncatched test error.");
		
		//var data: string = await fs.promises.readFile(staticHtmlFileFullPath, 'utf8'); // experimental
		var data: string = await new Promise<string>((
			resolve: (data: string) => void, reject: (err: Error) => void
		) => {
			fs.readFile(staticHtmlFileFullPath, 'utf8', (err: Error, data: string) => {
				// try to uncomment line bellow to see rendered error in browser:
				//throw new Error("Uncatched test error.");
				if (err) return reject(err);
				resolve(data);
			});
		});
		
		response.SetBody(data.replace(
			/%requestPath/g, 
			request.GetPath() + " (" + this.counter.toString() + "×)"
		)).Send();
	}
}

export default App;