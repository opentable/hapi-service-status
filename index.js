var service = require('./lib/service'),
    async = require('async'),
    joi = require("joi"),
    schema = require("./lib/schema"),
    _ = require('underscore');

var config = {};

var validateOptions = function(){
  var result = joi.validate(options, schema);
  if(result.error){
    throw result.error;
  }

  return result.value;
};

exports.register = function(plugin, options, next){
    plugin.log(["service-status"], "validating monitors");
    config = validateOptions(options);

    plugin.log(["service-status"], "registering service-status routes");
    plugin.route([
            {
                method: "GET",
                path: "/service-status",
                config: {
                    handler: function(request, reply) {
                        service.run(request.server, config.monitors[config.default || 0], function(result){
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
                            service.run(request.server, item, function(result){
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

                        service.run(request.server, monitor, function(result){
                            reply(result).code(200);
                        });
                    }
                }
            }
    ]);

    plugin.expose('selfTest', function(server, cb){
      service.selfTest(server, config.monitors, cb);
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
