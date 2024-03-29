# Node.js Development HTTP Server

[![Latest Stable Version](https://img.shields.io/badge/Stable-v3.0.27-brightgreen.svg?style=plastic)](https://github.com/web-dev-server/web-dev-server/releases)
[![Min. TypeScript Version](https://img.shields.io/badge/TypeScript-v3.7-brightgreen.svg?style=plastic)](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html)
[![Min. Node.JS Version](https://img.shields.io/badge/Node.JS-v10.0-brightgreen.svg?style=plastic)](https://nodejs.org/en/about/releases/)
[![License](https://img.shields.io/badge/Licence-BSD-brightgreen.svg?style=plastic)](https://github.com/web-dev-server/web-dev-server/blob/master/LICENSE.md)

Node.js simple http server for common development or training purposes in Javascript or Typescript.

## Outline  

1. [Installation](#user-content-1-installation)  
2. [Main Goals](#user-content-2-main-goals)  
3. [Examples](#user-content-3-examples)  
  3.1. [Create Server](#user-content-31-create-server)  
  3.2. [Create Application](#user-content-32-create-application)      
4. [Run Application](#user-content-4-run-application)  
5. [Run With Apache](#user-content-5-run-with-apache)  
  5.1.[Node.JS and Apache with `mod_proxy` extension](#user-content-51-nodejs-and-apache-with-mod_proxy-extension)  
  5.2. [Configuration Example In `.htaccess`](#user-content-52-configuration-example-in-htaccess)  

   
## 1. Installation

```shell
npm install web-dev-server
```

[go to top](#user-content-outline)


## 2. Main Goals
- **Flexible use**  
  - **Javascript or Typescript** application types.  
  - **Comfort development and debugging**.  
    There is no need to end (`CTRL+C`) and restart your web server instance every time  
   you make a change. Just save the file and refresh the page. The new content will  
   automatically load and appear in the debugging console. The server automatically   
   monitors dependent files and cleans up the `require.cache` in development mode.
  - **Possibility to use it together with your older apps** on Apache - [read more](#user-content-5-run-with-apache)
- **Less dependencies**
  - **tslib** - required for source code in TypeScript.
  - **mime-db** - required for proper file response mime type headers.
  - That's all! No `express` module and no `express-session` module, but possibility to use it.
- **Functions**
  - **Executing `index.js` files on server side**  
    `index.js` files are executed as default directory response - [see more](https://github.com/web-dev-server/example-helloworld/blob/master/dynamic-content/index.js).  
    Any virtual path inside directory with `index.js` file will be executed  
    as request on `index.js` file (like with Apache `mod_rewrite`).  
  - **Serving `index.html` files as default directory content**, if there is no  
    `index.js` script file to be executed (also serving `index.htm`, `default.html`  
   and `default.htm` by default).  
  - **Displaying directory content**  
    Only in development mode, configurable.
  - **Serving existing requested files**  
    Returned with proper mime type header.
  - **Build-in session management**  
    Sessions are stored in memory by default, with namespaces and namespaced  
   expiration times and expiration hoops and configurable load/write handlers.
  - **Custom `Request` and `Response` classes**  
    Extended from `http` module build-in request/response classes.  
  - **Uncached errors logging**  
    Uncatched errors and Primise's rejects are logged by custom handler,  
   where you could use build-in `WebDevServer.Logger` class.  
   Uncatched errors/rejects are also rendered in console and in client  
   reponse in develoment mode.
  - **Build-in logger utility**  
    Build in logger class could log (optionally) stack trace argument values.
- **Configuration**
  - Custom server req./res. pre-handler to be executed before standard request dispatching.
  - Custom server http handler (there could be used express handler, not included by default).
  - Custom server IP/domain and port.
  - Custom server document root directory (could be different from current working directory).
  - Custom server error handler to log uncatched errors.
  - Custom server forbidden request paths (`/node_modules`, `package.json`, ...)
  - Custom server directory index scripts and index file names.
  - Custom session cookie name, max. life time, max. lock waiting time, custom load/write handlers...
  - Custom logger directories to store logs, custom max. size for each log file and many more...


[go to top](#user-content-outline)


## 3. Examples

- [Hello World In Javascript](https://github.com/web-dev-server/example-helloworld)
- [Hello World In TypeScript](https://github.com/web-dev-server/example-helloworld-typescript)
- [Chat In Javascript](https://github.com/web-dev-server/example-chat-javascript)
- [Chat In TypeScript](https://github.com/web-dev-server/example-chat-typescript)
- [Chat In Angular 1](https://github.com/web-dev-server/example-chat-angular-1)
- read more in `src/tests` directory

### 3.1. Create Server

#### 3.1.1. Create Server In Javascript

- Open command line:
   - Initialize Node.JS project by `npm init`.
   - Install package by `npm install -y web-dev-server`.
- Create empty file `./run.js`.
- Initialize web development server instance in `./run.js`:
```js
var WebDevServer = require("web-dev-server");

// Create web server instance.
WebDevServer.Server.CreateNew()
   // Required.
   .SetDocumentRoot(__dirname)
   // Optional, 8000 by default.
   .SetPort(8000)
   // Optional, '127.0.0.1' by default.
   //.SetHostname('127.0.0.1')
   // Optional, `true` by default to display Errors and directories.
   //.SetDevelopment(false)
   // Optional, `null` by default, useful for Apache `mod_proxy` usage.
   //.SetBasePath('/node')
   // Optional, custom place to log any unhandled errors.
   //.SetErrorHandler(async function (err,code,req,res) {})
   // Optional, to prepend any execution before `web-dev-server` module execution.
   .AddPreHandler(async function (req, res, event) {
      if (req.GetPath() == '/health') {
       res.SetCode(200).SetBody('1').Send();
        // Do not anything else in `web-dev-server` module for this request:
         event.PreventDefault();
      }
      /*setTimeout(() => {
         throw new RangeError("Uncatched test error.");
      }, 1000);*/
   })
   // optional, callback called after server has been started or after error ocured
   .Start(function (success, err) {
      if (!success) console.error(err);
      console.log("Server is running.");
   });
```

[go to top](#user-content-outline)


#### 3.1.2. Create Server In Typescript

- Open command line:
   - Initialize Node.JS project by `npm init`.
   - Initialize TypeScript project by `tsc --init`.
   - Install packages by `npm install -y web-dev-server tslib`.
   - Install packages by `npm install -y --save-dev typescript @types/node`.
   
- Create empty file `./run.ts`.
- Initialize web development server instance in `./run.ts`:
```ts
import { Server, Request, Response, Event } from "web-dev-server";

// Create web server instance.
Server.CreateNew()
   // Required.
   .SetDocumentRoot(__dirname)
   // Optional, 8000 by default.
   .SetPort(8000)
   // Optional, '127.0.0.1' by default.
   //.SetHostname('127.0.0.1')
   // Optional, `true` by default to display Errors and directories
   //.SetDevelopment(false)
   // Optional, `null` by default, useful for apache proxy modes.
   //.SetBasePath('/node')
   // Optional, custom place to log any unhandled errors.
   /*.SetErrorHandler(async (
      err: Error,
      code: number,
      req: Request, 
      res: Response
   ) => { })*/
   // Optional, to prepend any execution before `web-dev-server` module execution.
   .AddPreHandler(async (
      req: Request, 
      res: Response, 
      event?: Event
   ) => {
      if (req.GetPath() == '/health') {
         res.SetCode(200).SetBody('1').Send();
        // Do not anything else in `web-dev-server` module for this request:
         event?.PreventDefault();
      }
      /*setTimeout(function () {
         throw new Error("Test error:-)");
      }, 1000);*/
   })
   // Callback param is optional. called after server has been started or after error ocured.
   .Start((success?: boolean, err?: Error) => {
      if (!success) return console.error(err);
      console.log("Server is running.");
   });
```

[go to top](#user-content-outline)


### 3.2. Create Application

#### 3.2.1. Create Application In Javascript

- Create empty folder `./app`, next to `./run.js` with new empty file `./app/index.js`  
  inside, executed as default directory content later.
- Initialize web application instance in `./app/index.js`:
```js
var WebDevServer = require("web-dev-server");

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

   constructor () {
      /**
       * @summary WebDevServer server instance.
       * @var {WebDevServer.Server}
       */
      this.server = null;
      /**
       * @summary Requests counter. 
       * @var {number}
       */
      this.counter = 0;
   }

   /** 
    * @summary Application start point.
    * @public
    * @param {WebDevServer.Server}   server
    * @param {WebDevServer.Request}  firstRequest
    * @param {WebDevServer.Response} firstResponse
    * @return {Promise<void>}
    */
   async Start (server, firstRequest, firstResponse) {
      this.server = server;
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
    * `index.js` script inside or into any non-existing directory,
    * inside directory with this script.
    * @public
    * @param {WebDevServer.Request}  request
    * @param {WebDevServer.Response} response
    * @return {Promise<void>}
    */
   async HttpHandle (request, response) {
      console.log("App http handle.");

      // increase request counter:
      this.counter++;
      
      // try to uncomment line bellow to see rendered error in browser:
      //throw new Error("Uncatched test error 1.");

      response
         .SetHeader('content-Type', 'text/javascript')
         .SetBody(
            JSON.stringify({
               basePath: request.GetBasePath(),
               path: request.GetPath(),
               domainUrl: request.GetDomainUrl(),
               baseUrl: request.GetBaseUrl(),
               requestUrl: request.GetRequestUrl(),
               fullUrl: request.GetFullUrl(),
               params: request.GetParams(false, false),
               appRequests: this.counter
            }, null, "\t")
         )
         .Send();
   }
};
module.exports = App;
```

[go to top](#user-content-outline)


#### 3.2.2. Create Application In Typescript

- Create empty folder `./app`, next to `./run.ts` with new empty file `./app/index.ts`  
  inside (`./app/index.js` will be executed as default directory content later).
- Initialize web application instance in `./app/index.ts`:
```ts
import { Server, Request, Response, IApplication } from "web-dev-server";

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
export default class App implements IApplication {

   /** @summary WebDevServer server instance. */
   protected server?: Server;
   
   /** @summary Requests counter. */
   protected counter: number = 0;

   /** @summary Application start point. */
   public async Start (server: Server, firstRequest: Request, firstResponse: Response): Promise<void> {
      this.server = server;
      // Any initializations:
      console.log("App start.");
   }

   /** 
    * @summary Application end point, called on unhandled error 
    * (on development server instance) or on server stop event.
    */
   public async Stop (server: Server): Promise<void> {
      // Any destructions:
      console.log("App stop.");
   }

   /**
    * @summary 
    * This method is executed each request to directory with 
    * `index.js` script inside or into any non-existing directory,
    * inside directory with this script.
    */
   public async HttpHandle (request: Request, response: Response): Promise<void> {
      console.log("App http handle.");

      // increase request counter:
      this.counter++;
      
      // try to uncomment line bellow to see rendered error in browser:
      //throw new Error("Uncatched test error 1.");

      response
         .SetHeader('content-Type', 'text/javascript')
         .SetBody(
            JSON.stringify({
               basePath: request.GetBasePath(),
               path: request.GetPath(),
               domainUrl: request.GetDomainUrl(),
               baseUrl: request.GetBaseUrl(),
               requestUrl: request.GetRequestUrl(),
               fullUrl: request.GetFullUrl(),
               params: request.GetParams(false, false),
               appRequests: this.counter
            }, null, "\t")
         )
         .Send();
   }
}
```

[go to top](#user-content-outline)


## 4. Run Application

- Open command line:
  - Optionally - build your TypeScript application by `tsc` (or `tsc -w` for continuous development).
  - Run prepared web server instance in file `./run.js` by `node ./run.js`.
- Open your browser and visit `http://127.0.0.1:8000/` and see, how it works with `/app/index.js` changes and errors.

[go to top](#user-content-outline)


## 5. Run With Apache

### 5.1. Node.JS and Apache with `mod_proxy` extension

To use **Node.JS** with **Apache** with the same **Session ID** is very usefull, when you need to bring more  
interactivity to your already existing web applications under Apache server with Node.JS.

Everything you need to do is to redirect some requests in `.htaccess` to Node.JS (for example all `/node(.*)` requests).  

Node.JS web server has to run on the same server machine on different port,  
for example **Apache** on port `:80`, **Node.JS** on port `:8000`.  

Users and their browsers will see the same port as before, the port `:80` with Apache,  
but all request starting with substring `/node` will be redirected to **Node.JS** web server  
application internally on web server into port `:8000`, including websockets.

[go to top](#user-content-outline)


### 5.2. Configuration Example In `.htaccess`

```apache
...
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
...

<VirtualHost "127.0.0.1:80">
    ServerName example.com
    DocumentRoot /var/www/html/example.com
    RewriteEngine on
    # Node.JS proxy - websockets:
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /node/(.*) ws://127.0.0.1:8000/$1 [P,L]
    # Node.JS proxy - http/https:
    RewriteCond %{REQUEST_URI} ^/node(.*)$
    RewriteRule /node(.*) http://127.0.0.1:8000$1 [P,L]
</VirtualHost>
```

#### And example with running Node.JS server with `.SetBasePath('/node')`
```ts
import { Server } from "web-dev-server";

Server.CreateNew()
   .SetDocumentRoot(__dirname)
   .SetHostname('127.0.0.1')
   .SetPort(8000)
   .SetBasePath('/node')  // <----
   .Start();
```
Read more here:  
https://stackoverflow.com/questions/52576182/nodejs-apache-config-for-proxy-pass/58338589#58338589

[go to top](#user-content-outline)

