
var util         = require("util");
var WebSocket = require('ws');
var EventEmitter = require("events").EventEmitter;

var _ = require("underscore");
var async = require('async');

module.exports = WSServer;
util.inherits(WSServer,EventEmitter);
var logger=console;

function WSServer(options) {
    EventEmitter.call(this);

    this.wss = new WebSocket.Server(options);
    this.connections=new Array();
    this.subscriptions={};
    this.history={};
    var self=this;
    this.wss.on('error',this.onerror);
    this.wss.on('connection',this.createOnConnection());
    this.on('subscribe',this.openConnection);
    this.on('event',this.clientEvent);
    this.on('connclosed',this.clientConnClosed)
    this.on('postevent',this.send_event);
    return self;
}

WSServer.prototype.onerror = function(err) {
    logger.log(err);
};

WSServer.prototype.onclose = function(err) {
    logger.log(err);
};

WSServer.prototype.createOnConnection = function() {
    var self=this;
    
    WSServer.prototype.onconnection = function(ws) {
        var server=this;
        ws.on('message',function (msg,flags) {
            logger.log("msg:"+msg);
            try {
                var message=JSON.parse(msg);
                self.emit(message.type,ws,message,flags);
            } catch(err) {
                ws.send('{type: "error",data:"invalid data"}');
            }
        });
        ws.on('close',function() {
            self.emit('connclosed',ws);
        });
        
    };
    
    return WSServer.prototype.onconnection;
}

WSServer.prototype.terminate = function() {
    this.wss.close();
}


WSServer.prototype.send_event = function(id,body,target) {
    body.id=id;
    body.updatedAt=Date.now();
    logger.log("send_event:"+JSON.stringify(body));
    this.send(this.store_event(body,target),target);
};

WSServer.prototype.send=function(body,target) {
    var event=this.format_event(body,target);
    var self=this;
    if(target=='dashboards') 
        async.each(self.connections,function(socket) {
            socket.send(event);
        },self.send_error);
    else {
        logger.log("id:"+body.id+",subs:"+Object.keys(this.subscriptions));
        if(this.subscriptions.hasOwnProperty(body.id))
        async.each(self.subscriptions[body.id],function(socket) {
            socket.send(event);
        },self.send_error);
    }
};

WSServer.prototype.openConnection = function(socket,msg,flags) {
    if(msg==null) {
        socket.send(this.format_error('empty message'));
        return;
    }
    try {
       var  mdata=msg.data;
        if(mdata==null) {
            socket.send(this.format_error('send subscribe message first'));
            return;
        }
        if(!mdata.hasOwnProperty('events') || mdata.events==null)
            return socket.send(this.format_error('no events in the request'));
        this.connections.push(socket);
        var self=this;
        var lastevents = new Array();
        mdata.events.forEach(function(id) {
            if(!self.subscriptions.hasOwnProperty(id))
                self.subscriptions[id]=[];
            var object = self.subscriptions[id];
            
            object.push(socket);
            if(self.history.hasOwnProperty(id)) lastevents.push(self.history[id]);
        });
        socket.send(JSON.stringify({type:'subscribe',data:{result: 'ok'}}));
        socket.send(JSON.stringify({type:'event',data:lastevents}));
    } catch(err) {
        socket.send(this.format_error(err));
    }
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
            Object.keys(self.subscriptions).forEach(function(id) {
                var list=self.subscriptions[id]
                self.subscriptions[id]=list.filter(socketfilter);});
        }
        ]);
}

WSServer.prototype.format_event=function(body,target) {
    var evttype= target==null ? 'event' : target;
    var event=JSON.stringify({type: evttype,data:body});
    logger.info('format_event:'+event);
    return event;
};

WSServer.prototype.format_error=function(errormsg) {
    logger.info(errormsg);
    if(errormsg.hasOwnProperty('stack')) logger.log(errormsg.stack);
    return this.format_event({type: 'error',data:{message: errormsg}});
};

WSServer.prototype.store_event = function(body,target) {
    if(target=='dashboards') return body;
    if(!this.history.hasOwnProperty(body.id)) this.history[body.id]={};
    body=merge_objects(body,this.history[body.id]);
    return body;
};

WSServer.prototype.send_error=function(error) {
    logger.log(error);
};

function merge_objects(source,dest) {
    Object.keys(source).forEach(function(key) {
        dest[key]=source[key];
    });
    return dest;
}