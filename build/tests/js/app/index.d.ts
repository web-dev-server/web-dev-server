export default App;
/**
 * @summary Exported class to handle directory requests.
 */
declare class App {
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
    Start(server: any, firstRequest: any, firstResponse: any): Promise<void>;
    /** @summary WebDevServer server instance. @var {WebDevServer.Server} */
    server: any;
    /** @summary Requests counter. @var {number} */
    counter: number;
    Stop(server: any): Promise<void>;
    /**
     * @summary This method is executed each request to directory with
     * 			`index.js` script inside (also executed for first time
     * 			immediately after constructor).
     * @public
     * @return {Promise<void>}
     */
    HttpHandle(request: any, response: any): Promise<void>;
}
