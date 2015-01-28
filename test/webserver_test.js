var should = require("should");
var request = require("supertest");
var fs = require("fs");

var Configuration = require("../lib/configuration.js");
var config=new Configuration();

var req = request("http://"+process.env.IP+":"+config.Web.port);

var testserver=null;

describe('test web server',function() {

    beforeEach(function(done) {
        var count=0;
        var testget=function() {
            req.get('/').end(function(err,res) {
               if(err) {
                   console.log(err);
                   
                   if(++count<5) 
                    setTimeout(testget,1000); //wait 1 second before next attempt
                    else
                        done();
                } 
                else done();
                count.should.be.lessThan(5);
            });
        }
        var testws = function() {
            var ws1 = new WebSocket('ws://'+process.env.IP+':'+config.WebSocket.port+config.WebSocket.path);
            ws1.on('open',function() {
                console.log('ws connected');
                ws1.close();
                done();
            }); 
            ws1.on('error',function(err) {
                count.should.be.lessThan(5);
                testws();
            });           
        }
        testget();
    });

     it('test_inexistent_route',function(done) {
         req.post('/').send(JSON.stringify({data:'a'})).expect(404,done);
     });
     
     it('call without token',function(done) {
        req.post('/data/d1').send(JSON.stringify({data:'a'})).expect(401,done);
     });

     it('call with invalid token',function(done) {
        req.post('/data/d2').send(JSON.stringify({auth_token:config.Web.auth_token+'_add',data:'a'})).expect(401,done);
     });

     it('call with alid token',function(done) {
        req.post('/data/d2').send(JSON.stringify({auth_token:config.Web.auth_token,data:'a'})).expect(204,done);
     });
     
    it('call with invalid data',function(done) {
        req.post('/data/d2').send("not a json").expect(400,done);
     });

     
     
});

