# Node.js Development HTTP Server

[![Latest Stable Version](https://img.shields.io/badge/Stable-v1.0.2-brightgreen.svg?style=plastic)](https://github.com/web-dev-server/web-dev-server/releases)
[![License](https://img.shields.io/badge/Licence-BSD-brightgreen.svg?style=plastic)](https://mvccore.github.io/docs/mvccore/4.0.0/LICENCE.md)

Node.js simple http server for common development or training purposes.

## Instalation
```shell
npm install web-dev-server
```

## Usage
```javascript
var WebDevServer = require("web-dev-server");
var devServerInstance = (new WebDevServer())
	.SetDocumentRoot(__dirname) // required
	// .SetPort(80)             // optional, 8000 by default
	// .SetDefault(false)       // optional, true by default to display Errors and directory content
	.Run();
```
