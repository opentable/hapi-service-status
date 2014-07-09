var _convertTimeToMS = function(time){
        // output of process.hrtime() gives an array of [seconds, nanoseconds]
        return (time[0] * 1000) + (time[1]/1000000);
    },

    _simpleThreshold = function(result, monitor){
        if(result.response >= 400 && result.response !== 404){
            return "Failed";
        }

        return result.time < monitor.timeout ? "Ok" : "Failed";
    },

    timeRequest = function(server, monitor, callback){
        var start = process.hrtime();

        server.inject({ url: monitor.path, headers: monitor.headers}, function(response){
            var timeInMS = _convertTimeToMS(process.hrtime(start));

            var result = {
                response: response.statusCode,
                path: monitor.path,
                time: timeInMS,
                monitorname: monitor.monitorname
            };

            result.status = _simpleThreshold(result, monitor);
            callback(result);
        });
    };

module.exports = {
    timeRequest: timeRequest
};