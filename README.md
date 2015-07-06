#Hapi service-status
[![Build Status](https://travis-ci.org/opentable/hapi-service-status.png?branch=master)](https://travis-ci.org/opentable/hapi-service-status) [![NPM version](https://badge.fury.io/js/hapi-service-status.png)](http://badge.fury.io/js/hapi-service-status) ![Dependencies](https://david-dm.org/opentable/hapi-service-status.png)

Shared code for the `service-status` endpoint.

Performs a check by injecting a request to a specified endpoint (using server.inject).

Installation:

```npm install --save hapi-service-status```

Usage:

```
var server = hapi.createServer();

server.pack.register(
  {
      plugin: require("hapi-service-status"),
      options: {
        failureStatusCode: 500,         // status code of the service-status response when monitor fails, default value is 200
        monitors: [
          {
            monitorname: 'mymonitor1',
            path: '/my/route/to/test/123',
            headers: {},
            timeout: 500 // if the request takes longer than this time (ms) then report as 'Failed'
          },
          {
            monitorname: 'mymonitor2',
            path: '/my/other/route/321',
            headers: {},
            compare: function(body){     // this function should return true or false based on body content
              return body.foo == "bar";  // returning false will result in a 'Failed' status
            }
          },
          {
            monitorname: 'mymonitor3',
            path: '/my/other/other/route',
            headers: {},
            timeout: 500,
            selfTest: false // exclude this monitor from the selfTest() function
          }
          // ...
        ]
        default: 1
      }
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


SelfTest:

Provides a method to run all the monitors and assert they are successful. Useful for a startup-self test.

```

server.start(function(){
  server.plugins['hapi-service-status'].selfTest(function(err){
      if(err){
        throw err;
      }
    });
});
```


Future plans:

- Maybe Ok/Warn/Fail threshold?
- Optionally fail on a 404
