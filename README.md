#Hapi service-status
[![Build Status](https://travis-ci.org/opentable/hapi-service-status.png?branch=master)](https://travis-ci.org/opentable/hapi-service-status) [![NPM version](https://badge.fury.io/js/hapi-service-status.png)](http://badge.fury.io/js/hapi-service-status) ![Dependencies](https://david-dm.org/opentable/hapi-service-status.png)

Shared code for the `service-status` endpoint. 

Performs a check by injecting a request to a specified endpoint (using server.inject).

Installation:

```npm install hapi-service-status```

Usage:

```
var server = hapi.createServer();

server.pack.require("hapi-service-status",
  {
    monitors: [
        { 
            path: '/my/route/to/test/123', 
            headers: {}, 
            timeout: 500 // if the request takes longer than this time (ms) then report as 'Failed'
        },
        { 
            path: '/my/other/route/321', 
            headers: {}, 
            timeout: 500
        }
    ],
    default: 0 // index of the default monitor
  },
  function (err){
    if(err){
      throw err;
    }
  }
);
```

Routes:


- `/service-status`                // runs the default monitor
- `/service-status/{monitorname}`  // runs the named monitor
- `/service-status/all`            // runs all monitors, use with caution


Future plans:

- Support for server packs