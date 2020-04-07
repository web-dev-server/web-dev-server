var fs = require("fs");

var WebDevServer = require("../../../lib/Server");

/**
 * @summary 
 * Exported class to handle directory requests.
 * 
 * When there is first request to directory with default 
 * `index.js` script inside, this class is automatically 
 * created and method `Start()` is executed.
 * All request are normally handled by method `HttpHandle()`.
 * If there is detected any file change inside this file 
 * or inside file included in this file (on development server 
 * instance), the module `web-dev-server` automaticly reloads 
 * all necesssary dependent source codes, stops previous instance 
 * by method `Stop`() and recreates this application instance again
 * by `Start()` method. The same realoding procedure is executed, 
 * if there is any unhandled error inside method `HttpHandle()` 
 * (to develop more comfortably).
 */
class App {
	
	/** 
	 * @summary Application start point.
	 * @public
	 * @param {WebDevServer.Server}   server
	 * @param {WebDevServer.Request}  firstRequest
	 * @param {WebDevServer.Response} firstResponse
	 * @return {Promise<void>}
	 */
	async Start (server, firstRequest, firstResponse) {
		/**
		 * @summary WebDevServer server instance.
		 * @var {WebDevServer.Server}
		 */
		this.server = server;
		/**
		 * @summary Requests counter. 
		 * @var {number}
		 */
		this.counter = 0;

		// Any initializations:
		console.log("App start.");
	}

	/** 
	 * @summary Application end point, called on unhandled error 
	 * (on development server instance) or on server stop event.
	 * @public
	 * @param {WebDevServer.Server} server
	 * @return {Promise<void>}
	 */
	async Stop (server) {
		// Any destructions:
		console.log("App stop.");
	}

	/**
	 * @summary 
	 * This method is executed each request to directory with 
	 * `index.js` script inside (also executed for first time 
	 * immediately after `Start()` method).
	 * @public
	 * @param {WebDevServer.Request}  request
	 * @param {WebDevServer.Response} response
	 * @return {Promise<void>}
	 */
	async HttpHandle (request, response) {
		console.log("App http handle.", request.GetFullUrl());

		// increase request counter:
		this.counter++;

		var stopParam = request.GetParam('stop', '0-9');
		if (stopParam) {
			response
				.SetHeader('connection', 'close')
				.SetBody("stopped")
				.Send(true, () => {
					this.server.Stop();
				});
			return;
		}

		var sessionExists = WebDevServer.Session.Exists(request);
		var sessionInitParam = request.GetParam('session_init', '\\d');
		if (!sessionExists) {
			if (!sessionInitParam) return response.Redirect('?session_init=1');
			(await WebDevServer.Session.Start(request, response)).GetNamespace("test").value = 0;
			return response.Redirect(request.GetRequestUrl());
		}
		var session = await WebDevServer.Session.Start(request, response);
		var sessionNamespace = session.GetNamespace("test").SetExpirationSeconds(30);
		sessionNamespace.value += 1;
		
		// some demo operation to say hallo world:
		var staticHtmlFileFullPath = this.server.GetDocumentRoot() + "/src/tests/assets/index.html";
		
		// try to uncomment line bellow to see rendered error in browser:
		//throw new Error("Uncatched test error 1.");

		if (!request.IsCompleted()) await request.GetBody();

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