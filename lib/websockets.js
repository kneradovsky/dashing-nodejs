
var util         = require("util");
var WebSocket = require('ws');
var EventEmitter = require("events").EventEmitter;

var _ = require("underscore");
var async = require('async');

module.exports = WSServer;
util.inherits(WSServer,EventEmitter);


function WSServer(options) {
    EventEmitter.call(this);

    this.wss = new WebSocket.Server(options);
    this.connections=new Array();
    this.subscriptions={};
    this.history={};
    var self=this;
    self.wss.on('error',this.onerror);
    self.wss.on('connection',this.onconnection);
    this.on('subscribe',this.openConnection);
    this.on('event',this.clientEvent);
    this.on('connclosed',this.clientConnClosed)
    return self;
}

WSServer.prototype.onerror = function(err) {
    console.log(err);
};

WSServer.prototype.onclose = function(err) {
    console.log(err);
};

WSServer.prototype.onconnection = function(ws) {
    var self = this; 
    ws.on('message',function (msg,flags) {
        var message=JSON.parse(msg);
        self.emit(message.type,ws,message,flags);
    });
    ws.on('close',function() {
        self.emit('connclosed',ws);
    });
    
};



WSServer.prototype.send_event = function(id,body,target) {
    body.id=id;
    body.updatedAt=Date.now();
    this.send(this.store_event(body,target),target);
};

WSServer.prototype.send=function(body,target) {
    var event=this.format_event(body,target);
    if(target=='dashboards') 
        async.each(this.connections,function(socket) {
            socket.send(event);
        },this.send_error);
    else async.each(this.subscriptions[body.id],function(socket) {
            socket.send(event);
        },this.send_error);
};

WSServer.prototype.openConnection = function(socket,data,flags) {
    if(data==null) {
        socket.send(JSON.stringify({type: 'error', data:'send subscribe message first'}),this.send_error);
        return;
    }
    this.connections.push(socket);
    var self=this;
    var lastevents = new Array();
    data.events.forEach(function(id) {
        var object = self.subscriptions.hasOwnProperty(id) ? self.subscriptions[id] : self.subscriptions[id]=new Array();
        object.push(socket);
        if(self.history.hasOwnProperty(id)) lastevents.push(self.history[id]);
    });
    socket.send(this.format_event({type:'subscribe',data:{result: 'ok'}}));
    socket.send(this.format_event({type:'event',data:lastevents}));
};

WSServer.prototype.clientEvent=function(socket,data,flags) {
    socket.send(this.format_event({type:'error',data:{result: 'events from clients are not supported'}}));
}

WSServer.prototype.clientConnClosed=function(socket) {
    var self=this;
    var socketfilter=function(item) {return item!=socket;};
    async.parallel([
        function() {self.connections=self.connections.filter(socketfilter);},
        function() {
            self.subscriptions.keys().forEach(function(id) {
                var list=self.subscriptions[id]
                self.subscriptions[id]=list.filter(socketfilter);});
        }
        ]);
}

WSServer.prototype.format_event=function(body,target) {
    var evttype= target==null ? 'event' : target;
    return JSON.stringify({type: evttype,data:body});
};

WSServer.prototype.store_event = function(body,target) {
    if(target=='dashboards') return body;
    if(!this.history.hasOwnProperty(body.id)) this.history[body.id]={};
    body=this.history[body.id].assign(body);
    return body;
};

WSServer.prototype.send_error=function(error) {
    console.log(error);
};
