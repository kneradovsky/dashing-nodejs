
var http = require('http');
var path = require('path');
var async = require('async');
var express = require('express');

var Configuration = require("./configuration");
var WebSocketEvents = require("./websockets");

var config = new Configuration();

var wsserver = new WebSocketEvents(config.WebSocket);

var logger=console;

var router = express();
var server = http.createServer(router);
var auth_token=config.Web.auth_token;

module.exports=Server;

function Server() {

    router.post('/data/:id',function(req,res) {
       var id=req.params.id;
       process_request(req,res,id);
    });
    
    router.post('/dashboards/:id',function(req,res) {
        var id=req.params.id;
        process_request(req,res,id,'dashboards');
    });
    
    server.listen(config.Web.port,config.Web.hostname,511,this.onlistening());
    this.httpserver=server;
    this.wsserver=wsserver;
    wsserver.wss.once('listening',this.onlistening());
    logger.log("current HTTP config:"+JSON.stringify(config.Web));
    logger.log("current WS config:"+JSON.stringify(config.WebSocket));
    
    this.servicesinited=0;
    return this;
};


Server.prototype.stopserver=function() { 
    try {
    this.wsserver.terminate();this.httpserver.close();
    } catch(err) {
        console.log(err);
    }
}

Server.prototype.initcomplete=function () {};

Server.prototype.onlistening = function() {
    var self=this;
    return function() {
        if(++self.servicesinited>1)
            self.initcomplete();
    }
}

function process_request(req,res,id,target) {
       var body='';
       req.on('data',function(chunk) {
           body+=chunk;
           if(body.length>config.Web.requestLimit) req.connection.destroy();
       });
       req.on('end',function() {
            logger.log("id:"+id+",post:"+body);
            bodyjson=null;
            try {
               var bodyjson=JSON.parse(body);
               if(bodyjson.auth_token==null) {
                   res.statusCode=401;
                   return res.end("No auth token");
               }
               if(bodyjson.auth_token!=auth_token) {
                   res.statusCode=401;
                   return res.end("Invalid token");
               }
               delete bodyjson.auth_token;
            } catch(err) {
               res.statusCode = 400;
               return res.end('error: ' + err.toString());
            }
               wsserver.emit('postevent',id,bodyjson,target);
               res.statusCode=204;
               res.end();
       });    
}