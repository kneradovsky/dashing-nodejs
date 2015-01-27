
var http = require('http');
var path = require('path');

var async = require('async');

var express = require('express');
var getRawBody = require('raw-body');

var Configuration = require("./configuration.js");
var WebSocketEvents = require("./lib/websockets.js");

var config = new Configuration();

var wsserver = new WebSocketEvents(config.WebSocket);

var logger=console;

var router = express();
var server = http.createServer(router);
var auth_token=config.Web.auth_token;

/*
router.use(function (req, res, next) {
  getRawBody(req, { limit: config.Web.requestLimit, encoding: config.Web.encoding}, 
  function (err, string) {
    if (err) return next(err)
    req.text = string
    logger.log("data="+string)
    next()
  })
});
*/



router.post('/data/:id',function(req,res) {
   var id=req.params.id;
   var body='';
   req.on('data',function(chunk) {
       body+=chunk;
       if(body.length>config.Web.requestLimit) req.connection.destroy();
   });
   req.on('end',function() {
        //var body=req.text;
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
           wsserver.send_event(id,bodyjson);
           res.statusCode=204;
           res.end();
   });
   
   
});

server.listen(config.Web.port,config.Web.hostname);