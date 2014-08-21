describe('service-status tests', function(){
    var should = require('should'),
        service = require('../lib/service'),
        server = {
            inject: function(options, callback){
                callback({ statusCode: 200, body: { foo: "bar" } });
            },
            log: function(){}
        },
        badserver = {
            inject: function(options, callback){
                callback({ statusCode: 500 });
            },
            log: function(){}
        },
        slowserver = {
            inject: function(options, callback){
                setTimeout(function(){ callback({ statusCode: 200 });}, 10);
            },
            log: function(){}
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
              log: function(){}
            };

        p.register(plugin, {}, function(){});
        r.length.should.eql(3);
        r[0].path.should.eql('/service-status');
        r[1].path.should.eql('/service-status/all');
        r[2].path.should.eql('/service-status/{monitorname}');
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

      it('should have status "Failed" when the response code is not 2xx or 4xx', function(done){
          service.run(badserver,
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
});
