# Node.js Development HTTP Server

[![Latest Stable Version](https://img.shields.io/badge/Stable-v2.0.0-brightgreen.svg?style=plastic)](https://github.com/web-dev-server/web-dev-server/releases)
[![Min. TypeScript Version](https://img.shields.io/badge/TypeScript-v3.7-brightgreen.svg?style=plastic)](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html)
[![License](https://img.shields.io/badge/Licence-BSD-brightgreen.svg?style=plastic)](https://github.com/web-dev-server/web-dev-server/blob/master/LICENCE.md)

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
- Displaying directories in development mode (development mode is `true` by default, configurable).
- Serving static content for any existing requested files (with `express` node module).
- Executing `index.js` files in server side by Node.JS for directory requests as default directory 
  response to serve:
    - There is necessary to assign into `module.exports` you desired class definition to be executed - [see more](https://github.com/web-dev-server/example-helloworld/blob/master/dynamic-content/index.js).
- Serving `index.html`, `index.htm`, `default.html`, `default.htm` files as default directory content,  
  if directory doesn't contain any `index.js` file to be executed.
- There is not necessary to kill ( by `CTRL + C` in command line) and re-run your script(s) again  
  (by `node run.js` in command line) for every server script change or for any uncatched Error inside.  
  You just need to work in development mode and save your `index.js` (`CTRL + S`) or any it's required  
  sub-script(s) and then, you can just refresh browser page and there will be ececuted fresh, realoded `*.js` files. 
- All errors rendered in browser for development mode.
- Possibility to add any custom express req./res. dispatching handler to be executed before `web-dev-server` 
  will dispatch the request in standard way:
    - Posibility to prevent `web-dev-server` request dispatching from custom handler.
- Configurable session hash salt, forbidden request paths and more.
- Possibility to use the server under Apache through `mod_proxy`, [read more here](#user-content-5-run-with-apache).

[go to top](#user-content-outline)


## 3. Examples

- [Hello World In Javascript](https://github.com/web-dev-server/example-helloworld)
- [Hello World In TypeScript](https://github.com/web-dev-server/example-helloworld-typescript)
- [Chat In Javascript](https://github.com/web-dev-server/example-chat-example-pure-js)
- [Chat In Angular 1](https://github.com/web-dev-server/example-chat-angular-1)

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
   //.SetDomain('127.0.0.1')
   // Optional, `true` by default to display Errors and directories.
   //.SetDevelopment(false)
   // Optional, 1 hour by default (seconds).
   //.SetSessionMaxAge(60 * 60 * 24)
   // Optional, session id hash salt.
   //.SetSessionHash('SGS2e+9x5$as%SD_AS6s.aHS96s')
   // Optional, `null` by default, useful for apache proxy modes.
   //.SetBaseUrl('/node')
   // Optional, custom place to log any unhandled errors.
   //.SetErrorHandler(function (e,code,req,res) {})
   // Optional, to prepend any execution before `web-dev-server` module execution.
   .AddHandler(function (req, res, evnt, cb) {
      if (req.url == '/health') {
         res.writeHead(200);
         res.end('1');
	 // Do not anything else in `web-dev-server` module for this request:
         evnt.PreventDefault();
      }
      /*setTimeout(() => {
         throw new RangeError("Uncatched test error.");
      }, 1000);*/
      cb();
   })
   // optional, callback called after server has been started or after error ocured
   .Run(function (success, err) {
      if (!success) console.error(err);
      console.log("Server is running.");
   });
```

[go to top](#user-content-outline)


#### 3.1.2. Create Server In Typescript

- Open command line:
   - Initialize Node.JS project by `npm init`.
   - Initialize TypeScript project by `tsc --init`.
   - Install packages by `npm install -y web-dev-server`.
   - Install packages by `npm install -y --save-dev @types/express-serve-static-core`.
   
- Create empty file `./run.ts`.
- Initialize web development server instance in `./run.ts`:
```ts
import * as core from "express-serve-static-core";
import * as WebDevServer from "web-dev-server";

// Create web server instance.
WebDevServer.Server.CreateNew()
   // Required.
   .SetDocumentRoot(__dirname)
   // Optional, 8000 by default.
   .SetPort(8000)
   // Optional, '127.0.0.1' by default.
   //.SetDomain('127.0.0.1')
   // Optional, `true` by default to display Errors and directories
   //.SetDevelopment(false)
   // Optional, 1 hour by default (seconds).
   //.SetSessionMaxAge(60 * 60 * 24)
   // Optional, session id hash salt.
   //.SetSessionHash('SGS2e+9x5$as%SD_AS6s.aHS96s')
   // Optional, `null` by default, useful for apache proxy modes.
   //.SetBaseUrl('/node')
   // Optional, custom place to log any unhandled errors.
   /*.SetErrorHandler((
      err: Error,
      code: number,
      req: core.Request<core.ParamsDictionary, any, any>, 
      res: core.Response<any>, 
   ) => { })*/
   // Optional, to prepend any execution before `web-dev-server` module execution.
   .AddHandler((
      req: core.Request<core.ParamsDictionary, any, any>, 
      res: core.Response<any>, 
      evnt: WebDevServer.Event, 
      cb: core.NextFunction
   ) => {
      if (req.url == '/health') {
         res.writeHead(200);
         res.end('1');
	 // Do not anything else in `web-dev-server` module for this request:
         evnt.PreventDefault();
      }
      /*setTimeout(() => {
         throw new RangeError("Uncatched test error.");
      }, 1000);*/
      cb();
   })
   // Callback param is optional. called after server has been started or after error ocured.
   .Run((success: boolean, err?: Error) => {
      if (!success) console.error(err);
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
var fs = require('fs');

/** 
 * @summary Application constructor, which is executed only once, 
 *                      when there is a request to directory with default index.js 
 *                      script inside. Then it's automatically created an instance 
 *                      of `module.exports` content. Then it's executed 
 *                      `handleHttpRequest` method on that instance. 
 *                      This is the way, how is directory request handled with 
 *                      default `index.js` file inside. 
 *                      If there is detected any file change inside this file 
 *                      (or inside file included in this file), the module 
 *                      `web-deb-server` automaticly reloads all necesssary 
 *                      dependent source codes and creates this application 
 *                      instance again. The same realoding procedure is executed, 
 *                      if there is any unhandled error inside method 
 *                      `handleHttpRequest` (to develop more comfortably).
 * @param {http}           http           Used node http module instance.
 * @param {express}        express        Used node express module instance.
 * @param {expressSession} expressSession Used node expressSession module instance.
 * @param {request}        request        Current http request object.
 * @param {response}       response       Current http response object.
 * @return void
 */
var App = function (http, express, expressSession, request, response) {
   // Any initializations:
   
};
App.prototype = {
   /**
    * @summary Requests counter.
    * @var {number}
    */
   counter: 0,
   /**
    * @summary This method is executed each request to directory with 
    *          `index.js` script inside (also executed for first time 
    *          immediately after constructor).
    * @param {request}  request  Current http request object.
    * @param {response} response Current http response object.
    * @return {Promise}
    */
    handleHttpRequest: function (request, response) {
      return new Promise(function (resolve, reject) {
         
         // try to uncomment line bellow to see rendered error in browser:
         //throw new Error("Unhandled test error.");

         // let's do anything asynchronous:
         fs.readdir(__dirname, {}, function (err, files) {
	    
            if (err) {
               console.log(err);
               return reject();
            }
	    
            this.counter++;
            response.send("Hello world (" + this.counter.toString() + "×)");
            resolve();
	       
         }.bind(this));
            
      }.bind(this));
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
import fs from "fs";
import http from "http";
import * as core from "express-serve-static-core";
import * as WebDevServer from "web-dev-server";

/**
 * @summary Exported class to handle directory requests.
 */
export default class App implements WebDevServer.IApplication {
   
   /** @summary Requests counter. */
   counter: number = 0;
   
   /** 
    * @summary Application constructor, which is executed only once, 
    *          when there is a request to directory with default `index.js`
    *          script inside. Then it's automatically created an instance 
    *          of `module.exports` content. Then it's executed 
    *          `handleHttpRequest` method on that instance. 
    *          This is the way, how is directory request handled with 
    *          default `index.js` file inside. 
    *          If there is detected any file change inside this file 
    *          (or inside file included in this file), the module 
    *          `web-deb-server` automaticly reloads all necesssary 
    *          dependent source codes and creates this application 
    *          instance again. The same realoding procedure is executed, 
    *          if there is any unhandled error inside method 
    *          `handleHttpRequest` (to develop more comfortably).
    */
   public constructor (
      httpServer: http.Server, 
      expressApp: core.Express, 
      sessionParser: core.RequestHandler<core.ParamsDictionary>, 
      request: core.Request<core.ParamsDictionary, any, any>, 
      response: core.Response<any>
   ) {
      // Any initializations:
      
   }

   /**
    * @summary This method is executed each request to directory with 
    *          `index.js` script inside (also executed for first time 
    *          immediately after constructor).
    */
   public async handleHttpRequest(
      request: core.Request<core.ParamsDictionary, any, any>, 
      response: core.Response<any>
   ): Promise<void> {
      // Called every request:
      
      // try to uncomment line bellow to see rendered error in browser:
      //throw new Error(":-)");
      
      // let's do anything asynchronous:
      //var files: string = await fs.promises.readdir(__dirname, {}); // experimental
      var files: string[] = await new Promise<string[]>((
         resolve: (files: string[]) => void, reject: (err: Error) => void
      ) => {
         fs.readdir(__dirname, (err: Error | null, files: string[]) => {
            if (err) return reject(err);
            resolve(files);
         });
      });


      this.counter++;
      response.send("Hello world (" + this.counter.toString() + "×)");
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
application on port `:8000` including websockets.

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
Read more here:  
https://stackoverflow.com/questions/52576182/nodejs-apache-config-for-proxy-pass/58338589#58338589

[go to top](#user-content-outline)

