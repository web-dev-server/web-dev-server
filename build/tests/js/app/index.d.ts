export default App;
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
declare class App {
    /**
     * @summary Application start point.
     * @public
     * @param {WebDevServer.Server}   server
     * @param {WebDevServer.Request}  firstRequest
     * @param {WebDevServer.Response} firstResponse
     * @return {Promise<void>}
     */
    public Start(server: WebDevServer.Server, firstRequest: WebDevServer.Request, firstResponse: WebDevServer.Response): Promise<void>;
    /**
     * @summary WebDevServer server instance.
     * @var {WebDevServer.Server}
     */
    server: WebDevServer.Server;
    /**
     * @summary Requests counter.
     * @var {number}
     */
    counter: number;
    /**
     * @summary Application end point, called on unhandled error
     * (on development server instance) or on server stop event.
     * @public
     * @param {WebDevServer.Server} server
     * @return {Promise<void>}
     */
    public Stop(server: WebDevServer.Server): Promise<void>;
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
    public HttpHandle(request: WebDevServer.Request, response: WebDevServer.Response): Promise<void>;
}
import WebDevServer = require("../../../lib/Server");
