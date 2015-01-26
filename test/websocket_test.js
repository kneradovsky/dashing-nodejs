var should = require("should");
var request = require("supertest");
var fs = require("fs");
var WebSocket = require('ws');



var Configuration = require("../configuration.js");
var config=new Configuration();

    var req = request("http://"+process.env.IP+":"+config.Web.port);

describe('web sockets connection test',function(done) {
    
    
    
    it('invalid json',function(done) {
        var ws = new WebSocket('ws://'+process.env.IP+':'+config.WebSocket.port+config.WebSocket.path);
        var error=true;
        ws.on('open',function() {
            ws.send('{ype: "subscribe,data:{events:["id1","id2"]}');
        }); 
        ws.on('message',function(data,flags) {
            data.toString().should.containEql('error');
            ws.terminate();
            done();
        });
    }); 
    
    it('valid json',function(done) {
        var ws = new WebSocket('ws://'+process.env.IP+':'+config.WebSocket.port+config.WebSocket.path);
        var error=false;
        ws.on('open',function() {
            ws.send(JSON.stringify({type: 'subscribe',data:{events:['id1','id2']}}));
        }); 
        ws.on('message',function(data,flags) {
            jd = JSON.parse(data);
            
            if(jd.type=='subscribe') {
               jd.data.result.should.eql('ok');
            } else {
                jd.type.should.eql('event');
                jd.should.have.property('data');
                ws.terminate();
                done();
            }
        });
    }); 
});

describe('subscriptions test',function(done) {
    

    
    it('test invalid subscription',function(done) {
        var ws = new WebSocket('ws://'+process.env.IP+':'+config.WebSocket.port+config.WebSocket.path);
        ws.on('open',function() {
            ws.send(JSON.stringify({type: 'subscribe'}));
        }); 
        ws.on('message',function(data,flags) {
            jd = JSON.parse(data);
            jd.data.type.should.eql('error');
            ws.terminate();
            done();
        });
    });
    
    describe('test receive last events',function(done) {
        it('send d1',function(done) {
            req.post('/data/d1').send(JSON.stringify({auth_token:config.Web.auth_token,data:'a1'})).expect(204,done);
        });
        it('send d2',function(done) {
            req.post('/data/d2').send(JSON.stringify({auth_token:config.Web.auth_token,data:'a2'})).expect(204,done);
        });

        it('receive last events',function(done) {
            var ws = new WebSocket('ws://'+process.env.IP+':'+config.WebSocket.port+config.WebSocket.path);
            ws.on('open',function() {
                ws.send(JSON.stringify({type: 'subscribe',data: {events:['d2','d1']}}));
            }); 
            ws.on('message',function(data,flags) {
                jd = JSON.parse(data);
                if(jd.type=='event') {
                    jd.data.should.length(2);
                    jd.data.forEach(function(d) {
                        (d.id=='d1' || d.id=='d2').should.be.true;
                    });
                    ws.terminate();
                    done();
                }
            });
        });
    });
    

    it('test receive events',function(done) {

        var ws = new WebSocket('ws://'+process.env.IP+':'+config.WebSocket.port+config.WebSocket.path);
        var msgcount=0;
        var msgs=[];
        ws.on('open',function() {
            ws.send(JSON.stringify({type: 'subscribe',data: {events:['d3','d4']}}));
        }); 
        ws.on('message',function(data,flags) {
            
            jd = JSON.parse(data);
            if(jd.type=='event') {
                if(msgcount==0) {
                    func = function(err,res) {if(err) throw err;};
                    req.post('/data/d3').send(JSON.stringify({auth_token:config.Web.auth_token,data:'a3'})).expect(204).end(func);
                    req.post('/data/d4').send(JSON.stringify({auth_token:config.Web.auth_token,data:'a4'})).expect(204).end(func);
                }
                if(!Array.isArray(jd.data)) {
                    msgcount++;
                    msgs.push(jd.data);
                }
                
            }
            if(msgcount>1) {
                msgs.forEach(function(d) {
                  (d.id=='d1' || d.id=='d2').should.be.false;
                  (d.id=='d3' || d.id=='d4').should.be.true;
                })
                ws.terminate();
                done();
            }
        });


    });
});