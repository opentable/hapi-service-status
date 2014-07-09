var service = require('./lib/service'),
    async = require('async'),
    _ = require('underscore');

var config = {};

exports.register = function(plugin, options, next){
    config = options;
    plugin.log(["debug", "service-status"], "registering service-status routes");
    plugin.route([
            {
                method: "GET",
                path: "/service-status",
                config: {
                    handler: function(request, reply) {
                        service.timeRequest(plugin.servers[0], config.monitors[config.default], function(result){
                            reply([result]);
                        });
                    }
                }
            },
            {
                method: "GET",
                path: "/service-status/all",
                config: {
                    handler: function(request, reply) {
                        var results = [];

                        var sendRequest = function(item, done){
                            service.timeRequest(plugin.servers[0], item, function(result){
                                results.push(result);
                                done();
                            });
                        };

                        async.forEach(config.monitors, sendRequest, function(){
                            reply(results);
                        });
                    }
                }
            },
            {
                method: "GET",
                path: "/service-status/{monitorname}",
                config: {
                    handler: function(request, reply) {

                        var monitor = _.find(config.monitors, function(m){ return m.monitorname === request.params.monitorname; });

                        if(!monitor){
                            reply("Unknown monitor name: " + request.params.monitorname).code(404);
                            return;
                        }

                        service.timeRequest(plugin.servers[0], monitor, function(result){
                            reply(result).code(200);
                        });
                    }
                }
            }
    ]);

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};