
var http = require('http');
var path = require('path');

var async = require('async');

var express = require('express');

var WebSocketEvents = require("./websockets.js");
var wsserver = new WebSocketEvents({port: 8080,path:'/websocket/connection'});

var router = express();
var server = http.createServer(router);

function consumePostData(res) {
    var data = new Buffer();
    while(chunk=res.read()) data.write(chunk.toString());
    return data.toString();
}

router.post('/data/:id',function(req,res) {
   id=req.params.id;
   body=consumePostData(res);
    bodyjson=null;
    try {
       bodyjson=JSON.parse(body);
    } catch(err) {
       res.statusCode = 400;
       return res.end('error: ' + er.message);
    }
       async(wsserver.send_event(id,bodyjson));
       res.statusCode=204;
       res.end();
});

