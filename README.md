# Node.js Development HTTP Server

[![Latest Stable Version](https://img.shields.io/badge/Stable-v2.0.0-brightgreen.svg?style=plastic)](https://github.com/web-dev-server/web-dev-server/releases)
[![Min. TypeScript Version](https://img.shields.io/badge/TypeScript-v3.7.7-brightgreen.svg?style=plastic)](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html)
[![License](https://img.shields.io/badge/Licence-BSD-brightgreen.svg?style=plastic)](https://github.com/web-dev-server/web-dev-server/blob/master/LICENCE.md)

Node.js simple http server for common development or training purposes in Javascript or Typescript.

## Outline  

1. [Installation](#user-content-1-installation)  
2. [Main Goals](#user-content-2-main-goals)  
3. [Usage](#user-content-3-usage)  
   3.1. [Create Server](#user-content-31-create-server)  
      3.1. 1. [Create Server in Javascript](#user-content-311-create-server-in-javascript)  
      3.1. 2. [Create Server in Typescript](#user-content-312-create-server-in-typescript)  
   3.2. [Create Application](#user-content-32-create-application)  
      3.2. 1. [Create Application in Javascript](#user-content-321-create-application-in-javascript)  
         3.2. 2. [Create Application in Typescript](#user-content-322-create-application-in-typescript)  
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
- displaying directories content in development mode (development mode is true by default, possible to change)
- serving static content for any existing files by default with `express` node module
- executing `index.js` file in server side by Node.JS for directory requests as default directory 
  response to serve
    - you need to assign into `module.exports` you desired class definition to be executed - [see more](https://github.com/web-dev-server/example-helloworld/blob/master/dynamic-content/index.js)
- serving `index.html`,`index.htm`,`default.html`,`default.htm` files as default directory content automaticly if no `index.js` file
- not necessary to kill (`CTRL + C`) and re-run your script(s) again (`node run.js`) for every server script change or for  
  any uncatched Error inside. You just need to work in development mode and save your `index.js` (`CTRL + S`) or any it's required  
  sub-script(s) and then, you can just refresh browser page and there will be ececuted fresh, realoded `*.js` files. 
- all errors rendered in browser for development mode
- posibility to add any custom express req/res dispatching handler to be executed before `web-dev-server` will dispatch the request
    - posibility to prevent `web-dev-server` request dispatching from custom handler
- possibility to use under Apache through `mod_proxy`, [read more here](#apache-and-nodejs-configuration-example-in-htaccess)

[go to top](#user-content-outline)


## 3. Usage

### 3.1. Create Server

#### 3.1.1. Create Server In Javascript

Create web development server instance in `./run.js` file:

```js
var WebDevServer = require("web-dev-server");
var devServer = (new WebDevServer())
    .SetDocumentRoot(__dirname)                       // required
    //.SetPort(8000)                                  // optional, 8000 by default
    //.SetDomain('localhost')                         // optional, 'localhost' by default
    //.SetSessionMaxAge(60 * 60 * 24)                 // optional, 1 hour by default, seconds
    //.SetSessionHash('SGS2e+9x5$as%SD_AS6s.aHS96s')  // optional, session id hash salt
    //.SetBasePath('/node')                           // optional, null by default, useful for apache proxy modes
    //.SetDevelopment(false)                          // optional, true by default to display Errors and directory content
    // .SetErrorHandler((e,code,req,res) => {})	      // optional, custom place to log any unhandled errors and warnings
    .AddHandler(function (req, res, e, cb) {          // optional, to prepend any execution before `web-dev-server` module execution
        if (req.url == '/health') {
            res.writeHead(200);
            res.end('1');
            e.preventDefault();                       // do not anything else in `web-dev-server` module for this request
        }
        cb();
    })
    .Run(function (success, err) {                    // optional, callback called after server has been started or after error ocured
		// ...
	});
```

[go to top](#user-content-outline)


#### 3.1.2. Create Server In Typescript


[go to top](#user-content-outline)


### 3.2. Create Application

#### 3.2.1. Create Application In Javascript

Create empty folder `./app`, next to `./run.js` with `./app/index.js`  
file inside, executed as default directory content later:

```js
var fs = require('fs');

/**
 * @summary Constructor, called only for first time, when there is default directory request with index.js 
            file inside and there is necessary to create instance of this `module.exports` content to call 
            `instance.httpRequestHandler` method to dispatch http request. If there is detected any file change
            inside this file, `web-deb-server` module automaticly reload content of this file and it creates
            instance and call this constructor again automaticly, the same behaviour if there is any catched error 
            in `httpRequestHandler` execution - this file and constructor is loaded and called again - to develop more comfortably.
 * @param   {http}           http           used node http module instance
 * @param   {express}        express        used node express module instance
 * @param   {expressSession} expressSession used node expressSession module instance
 * @param   {request}        request        current http request object
 * @param   {response}       response       current http response object
 * @return void
 */
var App = function (http, express, expressSession, request, response) {
    this._http = http;
    this._express = express;
    this._expressSession = expressSession;
};
App.prototype = {
    /**
     * @summary Method called each request to dispatch request for default directory content containing 
     *          `index,js` file (also for first time after constructor). 
     * @param   {request}  request  current http request object
     * @param   {response} response current http response object
     * @param   {function} callback callback to do any other node.js operations
     * @return  void
     */
    httpRequestHandler: function (request, response, callback) {
        this._completeWholeRequestInfo(request, function (requestInfo) {
            
            
            // some demo operation to say hallo world:
            var staticHtmlFileFullPath = __dirname + '/../static-content/index.html';
            fs.readFile(staticHtmlFileFullPath, 'utf8', function (err, data) {
                
                // try to uncomment line bellow to see rendered error in browser:
                //throw new Error(":-)");
                
                if (err) {
                    console.log(err);
                    return callback();
                }
                response.send(data.replace(/%requestPath/g, requestInfo.url));
                callback();
            });
            
            
        }.bind(this));
    },
    /**
     * @summary Complete whole request body to operate with it later properly (encode json data or anything else...)
     * @param   {request}  request  current http request
     * @param   {function} callback callback to execute after whole request body is loaded or request loading failed
     * @return  void
     */
    _completeWholeRequestInfo: function (request, callback) {
        var basePath = request.basePath === null ? '' : request.basePath,
            domainUrl = request.protocol + '://' + request.hostname,
            queryString = '', 
            delim = '?';
        for (var paramName in request.query) {
            queryString += delim + paramName + '=' + request.query[paramName];
            delim = '&';
        }
        var reqInfo = {
            basePath: basePath,
            path: request.path,
            requestPath: basePath + request.path,
            domainUrl: domainUrl,
            fullUrl: domainUrl + basePath + request.path + queryString,
            method: request.method,
            headers: request.headers,
            statusCode: request.statusCode,
            textBody: ''
        };
        var bodyArr = [];
        request.on('error', function (err) {
            console.error(err);
        }).on('data', function (chunk) {
            bodyArr.push(chunk);
        }).on('end', function () {
            reqInfo.textBody = Buffer.concat(bodyArr).toString();
            reqInfo.request = request;
            callback(reqInfo);
        }.bind(this));
    }
};
module.exports = App;
```

[go to top](#user-content-outline)


#### 3.2.2. Create Application In Typescript

```ts

```

[go to top](#user-content-outline)


## 4. Run Application

- Run in command line prepared web server instance in file `run.js` by `node run.js`.
- Open your browser and visit `http://localhost/` and see, how it works with `index.js` changes and errors.

[go to top](#user-content-outline)


## 5. Run With Apache

### 5.1. Node.JS and Apache with `mod_proxy` extension

To use **Node.JS** with **Apache** with the same **Session ID** is very usefull, when you need to bring more  
interactivity to your already existing web applications under Apache server with Node.JS.

Everything you need to do is to redirect some requests in `.htaccess` to Node.JS (for example all `/node(.*)` requests).  

Node.JS web server has to run on the same server machine on different por,  
for example **Apache** on port `:80`, **Node.JS** on port `:8888`.  

Users and their browsers will see the same port as before, the port `:80` with Apache,  
but all request starting with substring `/node` will be redirected to **Node.JS** web server  
application on port `:8888` including websockets.

[go to top](#user-content-outline)


### 5.2. Configuration Example In `.htaccess`

```apache
...
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
...

<VirtualHost 127.0.0.1:80>
    ServerName example.com
    DocumentRoot /var/www/html/example.com
    RewriteEngine on
    # Node.JS proxy - websockets:
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /node/(.*) ws://127.0.0.1:8888/$1 [P,L]
    # Node.JS proxy - http/https:
    RewriteCond %{REQUEST_URI} ^/node(.*)$
    RewriteRule /node(.*) http://127.0.0.1:8888$1 [P,L]
</VirtualHost>
```
Read more here:  
https://stackoverflow.com/questions/52576182/nodejs-apache-config-for-proxy-pass/58338589#58338589

[go to top](#user-content-outline)

