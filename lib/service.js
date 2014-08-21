var _convertTimeToMS = function(time){
        // output of process.hrtime() gives an array of [seconds, nanoseconds]
        return (time[0] * 1000) + (time[1]/1000000);
    },

    _checkStatusCode = function(statusCode){
      return statusCode === 200 || statusCode === 404;
    },

    timeRequest = function(server, monitor, callback){
        var start = process.hrtime();

        server.inject({ url: monitor.path, headers: monitor.headers}, function(response){
            var timeInMS = _convertTimeToMS(process.hrtime(start));
            var result = {
                response: response.statusCode,
                path: monitor.path,
                monitorname: monitor.monitorname,
                time: timeInMS,
                status: _checkStatusCode(response.statusCode) && timeInMS < monitor.timeout ? "Ok" : "Failed"
            };

            result.body = (result.status === "Failed") ? response.body : undefined;
            callback(result);
        });
    },

    compareRequest = function(server, monitor, callback){
      server.inject({ url: monitor.path, headers: monitor.headers}, function(response){
          var result = {
              response: response.statusCode,
              path: monitor.path,
              monitorname: monitor.monitorname,
              status: _checkStatusCode(response.statusCode) && monitor.compare(response.body) ? "Ok" : "Failed"
          };

          result.body = result.status === "Failed" ? response.body : undefined;
          callback(result);
      });
    },

    run = function(server, monitor, callback){
      if(typeof(monitor.compare) === 'function'){
        return compareRequest(server, monitor, callback);
      }

      return timeRequest(server, monitor, callback);
    };

module.exports = {
    run: run
};
