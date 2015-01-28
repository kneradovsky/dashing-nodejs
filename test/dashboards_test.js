var should = require("should");
var request = require("supertest");
var fs = require("fs");
var WebSocket = require('ws');



var Configuration = require("../lib/configuration.js");
var config=new Configuration();



var req = request("http://"+process.env.IP+":"+config.Web.port);

var testserver=null; 


describe('dashboards test',function() {

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

        it('all dashboards',function(done) {
            func = function(err,res) {if(err) throw err;};
            

            var ws = new WebSocket('ws://'+process.env.IP+':'+config.WebSocket.port+config.WebSocket.path);
            ws.on('open',function() {
                ws.send(JSON.stringify({type: 'subscribe',data: {events:['d5']}}));
                
            }); 
            ws.on('message',function(data,flags) {
                jd = JSON.parse(data);
                if(jd.type=='event') 
                    req.post('/dashboards/*').send(JSON.stringify({auth_token:config.Web.auth_token,event:'reload'})).expect(204).end(func);
                if(jd.type=='dashboards') {
                    jd.data.should.have.property('event');
                    jd.data.id.should.eql('*')
                    ws.terminate();
                    done();
                }
            });
        });

    

    it('one dashboard',function(done) {

        var ws = new WebSocket('ws://'+process.env.IP+':'+config.WebSocket.port+config.WebSocket.path);
        var msgcount=0;
        var msgs=[];
        ws.on('open',function() {
            ws.send(JSON.stringify({type: 'subscribe',data: {events:['d6']}}));
        }); 
        ws.on('message',function(data,flags) {
            
            jd = JSON.parse(data);
            if(jd.type=='event') {
                if(msgcount==0) {
                    func = function(err,res) {if(err) throw err;};
                    req.post('/dashboards/db1').send(JSON.stringify({auth_token:config.Web.auth_token,event:'reload'})).expect(204).end(func);
                }
                if(!Array.isArray(jd.data)) {
                    msgcount++;
                    msgs.push(jd.data);
                }
                
            }
            if(jd.type=='dashboards') {
                jd.data.should.have.property('event');
                jd.data.id.should.eql('db1')
                ws.terminate();
                done();
            }
        });


    });
});

