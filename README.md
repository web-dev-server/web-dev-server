# Node.js Development HTTP Server

[![Latest Stable Version](https://img.shields.io/badge/Stable-v1.0.5-brightgreen.svg?style=plastic)](https://github.com/web-dev-server/web-dev-server/releases)
[![License](https://img.shields.io/badge/Licence-BSD-brightgreen.svg?style=plastic)](https://mvccore.github.io/docs/mvccore/4.0.0/LICENCE.md)

Node.js simple http server for common development or training purposes.

## Instalation
```shell
npm install web-dev-server
```

## Main Goals
- displaying directories content in development mode (development mode is true by default, possible to change)
- serving static content for any existing files by default with express node module
- executing `index.js` file in server side by node for directory requests as default directory response to serve
	- you need to assign into `module.exports` you desired class definition to be executed - [see more](https://github.com/web-dev-server/example-helloworld/blob/master/dynamic-content/index.js)
- serving `index.html`,`index.htm`,`default.html`,`default.htm` files as default directory content automaticly if no `index.js` file
- not necessary to kill (`CTRL + C`) and run your script again (`node script.js`), 
  you just need to save your `script.js` (`CTRL + S`). If there is any uncatched Error 
  in your script execution, node process dies as usual and it's necessary to run it again (node script.js).
- posibility to add any custom express request/response dispatching handler to be executed before `web-dev-server` will dispatch request
	- posibility to prevent `web-dev-server` request dispatching from custom handler

## Usage
```javascript
var WebDevServer = require("web-dev-server");
var devServerInstance = (new WebDevServer())
	.SetDocumentRoot(__dirname) // required
	// .SetPort(80)             // optional, 8000 by default
	// .SetDevelopment(false)   // optional, true by default to display Errors and directory content
	.Run();
```
