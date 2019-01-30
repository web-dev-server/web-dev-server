# Node.js Development HTTP Server

[![Latest Stable Version](https://img.shields.io/badge/Stable-v1.3.0-brightgreen.svg?style=plastic)](https://github.com/web-dev-server/web-dev-server/releases)
[![License](https://img.shields.io/badge/Licence-BSD-brightgreen.svg?style=plastic)](https://github.com/web-dev-server/web-dev-server/blob/master/LICENCE.md)

Node.js simple http server for common development or training purposes.

## Instalation
```shell
npm install web-dev-server
```

## Main Goals
- displaying directories content in development mode (development mode is true by default, possible to change)
- serving static content for any existing files by default with express node module
- executing `index.js` file in server side by node for directory requests as default directory 
  response to serve
    - you need to assign into `module.exports` you desired class definition to be executed - [see more](https://github.com/web-dev-server/example-helloworld/blob/master/dynamic-content/index.js)
- serving `index.html`,`index.htm`,`default.html`,`default.htm` files as default directory content automaticly if no `index.js` file
- not necessary to kill (`CTRL + C`) and re-run your script again (`node index.js`) for every script change 
  or for any catched/uncatched Error inside. You just need to save your `index.js` (`CTRL + S`) or refresh 
  browser (if there is was any Error) and there will be ececuted new `index.js` version in next request.
  Also all remembered `index.js` scripts instances are forgotten in any catched/uncatched error 
  and there is created new `index.js` exported content instance in next request to see changed result.
- all errors rendered in browser for development mode
- posibility to add any custom express request/response dispatching handler to be executed before 
  `web-dev-server` will dispatch request
    - posibility to prevent `web-dev-server` request dispatching from custom handler
- possibility to use under Apache through `mod_proxy`
    - to do so, you need to redirect some requests to localhost on different port on your webserver machine:
    - `RewriteRule /node(.*) http://127.0.0.1:8000$1 [P,L]`

## Usage
#### 1. Create web development server instance initialization in `run.js` file and run it by `node run.js`:
```javascript
var WebDevServer = require("web-dev-server");
var devServer = (new WebDevServer())
    .SetDocumentRoot(__dirname)    // required
    //.SetPort(8000)        // optional, 8000 by default
    //.SetDomain('localhost')    // optional, 'localhost' by default
    //.SetSessionMaxAge(60 * 60 * 24)    // optional, 1 hour by default, seconds
    //.SetSessionHash('SGS2e+9x5$as%SD_AS6s.aHS96s')    // optional, session id hash salt
    //.SetBasePath('/node')    // optional, null by default, useful for apache proxy modes
    //.SetDevelopment(false)    // optional, true by default to display Errors and directory content
    .AddHandler(function (req, res, e, cb) {// optional, to prepend any execution before `web-dev-server` module execution
        if (req.url == '/health') {
            res.writeHead(200);
            res.end('1');
            e.preventDefault();    // do not anything else in `web-dev-server` module for this request
        }
        cb();
    })
    .Run();
```
#### 2. Create empty folder next to `run.js` with `index.js` file inside, executed as default directory content:
```javascript
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
#### 3. Open your browser and visit `http://localhost/` and see how it works with `index.js` changes and errors
