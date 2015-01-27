
var http = require('http');
var path = require('path');

var async = require('async');

var express = require('express');

var Configuration = require("./configuration.js");
var WebSocketEvents = require("./lib/websockets.js");

var config = new Configuration();

var wsserver = new WebSocketEvents(config.WebSocket);

var logger=console;

var router = express();
var server = http.createServer(router);
var auth_token=config.Web.auth_token;



router.post('/data/:id',function(req,res) {
   var id=req.params.id;
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
           wsserver.emit('postevent',id,bodyjson);
           res.statusCode=204;
           res.end();
   });
   
   
});

server.listen(config.Web.port,config.Web.hostname);