var fs = require("fs");

var WebDevServer = require("../../../lib/Server");


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
	constructor (server, request, response) {
		super(server);
		/** 
		 * @summary Requests counter.
		 * @var {number}
		 */
		this.counter = 0;
		// Any initializations:
		
	}

	/**
	 * @summary This method is executed each request to directory with 
	 * 			`index.js` script inside (also executed for first time 
	 * 			immediately after constructor).
	 * @public
	 * @return {Promise<void>}
	 */
	async ServerHandler(request, response) {

		// increase request counter:
		this.counter++;

		var sessionExists = WebDevServer.Applications.Session.Exists(request);
		var sessionInitParam = request.GetParam('session_init', '\\d');
		if (!sessionExists) {
			if (!sessionInitParam) return response.Redirect('?session_init=1');
			(await WebDevServer.Applications.Session.Start(request, response)).GetNamespace("test").value = 0;
			return response.Redirect(request.GetRequestUrl());
		}
		var session = await WebDevServer.Applications.Session.Start(request, response);
		var sessionNamespace = session.GetNamespace("test").SetExpirationSeconds(30);
		sessionNamespace.value += 1;
		
		// some demo operation to say hallo world:
		var staticHtmlFileFullPath = this.server.GetDocumentRoot() + "/src/tests/assets/index.html";
		
		// try to uncomment line bellow to see rendered error in browser:
		//throw new Error("Uncatched test error 1.");

		//var data = await fs.promises.readFile(staticHtmlFileFullPath, 'utf8'); // experimental
		var data = await new Promise(function(resolve, reject) {
			fs.readFile(staticHtmlFileFullPath, 'utf8', function (err, data) {
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