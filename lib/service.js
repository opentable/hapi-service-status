var async = require("async"),
    _ = require("underscore"),
    selfTestPassed = false;

var _convertTimeToMS = function(time){
        // output of process.hrtime() gives an array of [seconds, nanoseconds]
        return (time[0] * 1000) + (time[1]/1000000);
    },

    _checkStatusCode = function(statusCode){
      return statusCode === 200 || statusCode === 404;
    },

    timeRequest = function(server, monitor, callback){
        var start = process.hrtime();

        monitor.headers = monitor.headers || {};
        monitor.headers["user-agent"] = monitor.headers["user-agent"] || 'service-status';

        server.inject({ url: monitor.path, headers: monitor.headers}, function(response){
            var timeInMS = _convertTimeToMS(process.hrtime(start));
            var result = {
                response: response.statusCode,
                path: monitor.path,
                monitorname: monitor.monitorname,
                time: timeInMS,
                status: _checkStatusCode(response.statusCode) && timeInMS < monitor.timeout ? "Ok" : "Failed"
            };

            callback(result);
        });
    },

    compareRequest = function(server, monitor, callback){
      server.inject({ url: monitor.path, headers: monitor.headers}, function(response){
          var result = {
              response: response.statusCode,
              path: monitor.path,
              monitorname: monitor.monitorname,
              status: response.statusCode === 200 && monitor.compare(JSON.parse(response.payload)) ? "Ok" : "Failed"
          };
          callback(result);
      });
    },

    run = function(server, monitor, callback){
      if(typeof(monitor.compare) === 'function'){
        return compareRequest(server, monitor, callback);
      }

      return timeRequest(server, monitor, callback);
    },

    selfTest = function(server, monitors, callback){
      server.log(["service-status"], "initiating self-test");
      var failures = [];
      async.eachSeries(monitors, function(m, done){
        if(!m.selfTest){
          server.log(["service-status"], m.monitorname + ": Skipped");
          return done();
        }

        run(server, m, function(res){
          server.log(["service-status"], m.monitorname + ": " + res.status);
          if(res.status === "Failed"){
            failures.push(res);
          }

          done();
        });
      }, function(err){
        if(failures.length > 0){
          return callback(new Error("self test failed"));
        }
        selfTestPassed = true;
        callback();
      });
    };

module.exports = {
    run: run,
    selfTest: selfTest,
    selfTestPassed: function(){
      return selfTestPassed;
    }
};
