var should = require("should");
var request = require("supertest");
var fs = require("fs");

var Configuration = require("../config.js");
var config=new Configuration();

var req = request("http://"+process.env.IP+":"+config.Web.port);
describe('test web server',function() {

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


