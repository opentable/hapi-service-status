describe('service-status tests', function(){
    var should = require('should'),
        service = require('../lib/service'),
        server = {
            inject: function(options, callback){
                callback({ statusCode: 200, payload: '{ "foo": "bar" }' });
            },
            log: function(){}
        },
        badserver = {
            inject: function(options, callback){
                callback({ statusCode: 500 });
            },
            log: function(){}
        },
        notfoundserver = {
            inject: function(options, callback){
                callback({ statusCode: 404 });
            },
            log: function(){}
        },
        slowserver = {
            inject: function(options, callback){
                setTimeout(function(){ callback({ statusCode: 200 });}, 10);
            },
            log: function(){}
        },
        options = {
          monitors: [{
            monitorname: "MyMonitor1",
            path: "/path/to/test",
            headers: { "accept-language": "en-US"},
            timeout: 500
          },
          {
            monitorname: "MyMonitor2",
            path: "/path/to/test",
            headers: { "accept-language": "en-US"},
            compare: function(){}
          }],
          default: 0
        };

    it('should register the routes', function(){
        var p = require('../index.js'),
            r = [],
            plugin = {
              route: function(route) {
                  if(Array.isArray(route)){
                      route.forEach(function(ro){ r.push(ro); });
                  } else { r.push(route); }
              },
              log: function(){},
              expose: function(){}
            };

        p.register(plugin, options, function(){});
        r.length.should.eql(3);
        r[0].path.should.eql('/service-status');
        r[1].path.should.eql('/service-status/all');
        r[2].path.should.eql('/service-status/{monitorname}');
    });

    describe('validation', function(){
      var schema = require('../lib/schema'),
          joi = require('joi')

      it('should not allow missing monitorname', function(done){
        joi.validate({
          monitors: [{
            path: "/path/to/test",
            headers: { "accept-language": "en-US"},
            timeout: 500
          }]
        }, schema, function(err, value){
          done(!err ? new Error("allowed an empty monitorname") : undefined);
        });
      });

      it('should not allow missing path', function(done){
        joi.validate({
          monitors: [{
            monitorname: "MyMonitor",
            headers: { "accept-language": "en-US"},
            timeout: 500
          }]
        }, schema, function(err, value){
          done(!err ? new Error("allowed an empty path") : undefined);
        });
      });

      it('should not allow timeout and compare together', function(done){
        joi.validate({
          monitors: [{
            monitorname: "MyMonitor",
            path: "/path/to/test",
            headers: { "accept-language": "en-US"},
            timeout: 500,
            compare: function(){}
          }]
        }, schema, function(err, value){
          done(!err ? new Error("allowed timeout and compare together") : undefined);
        });
      });

      it('should not allow missing timeout and compare', function(done){
        joi.validate({
          monitors: [{
            monitorname: "MyMonitor",
            path: "/path/to/test",
            headers: { "accept-language": "en-US"}
          }]
        }, schema, function(err, value){
          done(!err ? new Error("allowed timeout and compare together") : undefined);
        });
      });

      it('should allow missing headers', function(done){
        joi.validate({
          monitors: [{
            monitorname: "MyMonitor",
            path: "/path/to/test",
            timeout: 500,
          }]
        }, schema, function(err, value){
          done(err);
        });
      });

      it('should not allow empty monitor array', function(done){
        joi.validate({
          monitors: []
        }, schema, function(err, value){
          done(!err ? new Error("allowed empty monitor array") : undefined);
        });
      });
    });

    describe('timed', function(){
      it('should inject the request', function(done){
          service.run(server,
              {
                  path: "/my/route/to/test",
                  headers: {},
                  timeout: 500,
                  monitorname: "MyMonitor"
              },
              function(result){
                  result.response.should.eql(200);
                  done();
              }
          );
      });

      it('should include the response code', function(done){
          service.run(server,
              {
                  path: "/my/route/to/test",
                  headers: {},
                  timeout: 500,
                  monitorname: "MyMonitor"
              }, function(result){
                  result.response.should.eql(200);
                  done();
              });
      });

      it('should have status "Ok" when the response code is 200', function(done){
          service.run(server,
              {
                  path: "/my/route/to/test",
                  headers: {},
                  timeout: 500,
                  monitorname: "MyMonitor"
              }, function(result){
                  result.status.should.eql("Ok");
                  done();
              });
      });

      it('should have status "Failed" when the response code is not 2xx or 4xx', function(done){
          service.run(badserver,
              {
                  path: "/my/route/to/test",
                  headers: {},
                  timeout: 500,
                  monitorname: "MyMonitor"
              }, function(result){
                  result.status.should.eql("Failed");
                  done();
              });
      });

      it('should have status "Failed" when the response time is above the threshold', function(done){
          service.run(slowserver,
              {
                  path: "/my/route/to/test",
                  headers: {},
                  timeout: 5,
                  monitorname: "MyMonitor"
              }, function(result){
                  result.status.should.eql("Failed");
                  done();
              });
      });
    });

    describe('compare', function(){
      it('should inject the request', function(done){
          service.run(server,
              {
                  path: "/my/route/to/test",
                  headers: {},
                  monitorname: "MyMonitor",
                  compare: function(){ return true; }
              },
              function(result){
                  result.response.should.eql(200);
                  done();
              }
          );
      });

      it('should include the response code', function(done){
          service.run(server,
              {
                  path: "/my/route/to/test",
                  headers: {},
                  monitorname: "MyMonitor",
                  compare: function(){ return true; }
              }, function(result){
                  result.response.should.eql(200);
                  done();
              });
      });

      it('should have status "Ok" when the response code is 200', function(done){
          service.run(server,
              {
                  path: "/my/route/to/test",
                  headers: {},
                  monitorname: "MyMonitor",
                  compare: function(){ return true; }
              }, function(result){
                  result.status.should.eql("Ok");
                  done();
              });
      });

      it('should have status "Failed" when the response code is not 200', function(done){
          service.run(notfoundserver,
              {
                  path: "/my/route/to/test",
                  headers: {},
                  monitorname: "MyMonitor",
                  compare: function(){ return true; }
              }, function(result){
                  result.status.should.eql("Failed");
                  done();
              });
      });

      it('should have status "Ok" when the value matches', function(done){
          service.run(server,
              {
                  path: "/my/route/to/test",
                  headers: {},
                  monitorname: "MyMonitor",
                  compare: function(body){
                    return body.foo === "bar";
                  }
              }, function(result){
                  result.status.should.eql("Ok");
                  done();
              });
      });

      it('should have status "Failed" when the value doesn\'t matche', function(done){
          service.run(server,
              {
                  path: "/my/route/to/test",
                  headers: {},
                  monitorname: "MyMonitor",
                  compare: function(body){
                    return body.foo === "foobar";
                  }
              }, function(result){
                  result.status.should.eql("Failed");
                  done();
              });
      });
    });

    describe('selfTest', function(){
      it('should exclude monitors where selfTest = false', function(done){
        var wasCalled = false;
        var server = {
          inject: function(options, callback){
            wasCalled = true;
            callback();
          },
          log: function(){}
        };

        service.selfTest(server, [{ selfTest: false }], function(){
          wasCalled.should.eql(false);
          done();
        });
      });

      it('should invoke monitors where selfTest = true', function(done){
        var wasCalled = false;
        var server = {
          inject: function(options, callback){
            wasCalled = true;
            callback({ statusCode: 200, payload: '{}' });
          },
          log: function(){}
        };

        service.selfTest(
          server,
          [{ selfTest: true, compare: function(){ return true; } }],
          function(){
            wasCalled.should.eql(true);
            done();
          }
        );
      });

      it('should return an error if a monitor fails', function(done){
        var server = {
          inject: function(options, callback){
            callback({ statusCode: 200, payload: '{}' });
          },
          log: function(){}
        };

        service.selfTest(
          server,
          [{ selfTest: true, compare: function(){ return false; } }],
          function(err){
            done(!err ? new Error("didn't return an error on failing monitor") : undefined);
          }
        );
      });
    });
});
