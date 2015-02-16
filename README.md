# dashing-nodejs
Javascript Nodejs implementation of the external web socket server for [dashenee](https://github.com/kneradovsky/dashenee) dashboard

## Installation
1. In the project's folder: npm install
2. Start the server using command: node testserver.js

## Configuration
The server is configured using Configuration object. The default object is defined in the ./lib/configuration.js

```JavaScript
Configuration.Web = function() {
    this.port=3030;
    this.host="0.0.0.0";
    this.auth_token="YOUR_AUTH_TOKEN";
    this.requestLimit=1e6;
    this.encoding='UTF-8';
    return this;
}

Configuration.WebSocket = function() {
    this.port=3040;
    this.path="/websocket/connection";
}
```

The server accepts the filename of the custom configuration as the commandline parameter:
```
node testserver.js config.js
```

Sample custom configuration file:
```JavaScript
module.exports = Configuration;

function Configuration() {
    this.Web = new Configuration.Web()
    this.WebSocket = new Configuration.WebSocket();   
}

Configuration.Web = function() {
    this.port=3031;
    this.host="0.0.0.0";
    this.auth_token="YOUR_AUTH_TOKEN";
    this.requestLimit=1e6;
    this.encoding='UTF-8';
    return this;
}

Configuration.WebSocket = function() {
    this.port=3041;
    this.path="/websocket/connection";
}
```

## URL Mappings
The dashws defines the following url mappings relative to its context
- /data/dataid - accepts post request from *dataid* datasource.
- /dashboards/dashboardid - sends command to reload *dashboardid* to the all connected clients. *Dashboardid* could be * which means all dashboards. 
- /websocket/connection - the Web Socket endpoint of the dashws. 

## The Protocol

### Data sources
A data source with ID=*DATAID* has to send post request to the /data/DATAID uri. 
Request requirements: 

- The request body has to be well formed JSON object. 
- JSON object has to have *auth_token* property
- JSON object could have any childred of any valid JSON type (simple types, object, list)   

### WebSocket clients 

1. Client receives the 'ack' and sends subsribe request with list of the IDs of the data sources in the data.events property: 
```JSON
{"type":"subscribe","result":"ok"}
{"type":"event", "data":{"events":["id1","id2"]}}
```

2. Server processes the request and responds the list of the latest events for the subscribed data sources:
```JSON
{"type":"event","data":[{"id":"id1","value":"test","temp":"100F"},{"id":"id2","value":"shutdown","rpm":"0"}]}
```

3. On data event from datasource *dataid* the server sends the data to the clients that have subscribed for the events from that data source:
```JSON
{"type":"event","data":{"id":"dataid","value": "ok","temp":"200F"}}
```
The format of the data is defined by the datasource *dataid*


#### Sample dataflow.
Packets marked by ">>>" are sent from the dashws server, packets marked by "<<<" are sent to the dashws server
```JSON
<<< {"type":"subscribe", "data":{"events":["id1","id2"]}}
>>> {"type":"subscribe","result":"ok"}
>>> {"type":"event","data":[{"id":"id1","value":"test","temp":"100F"},{"id":"id2","value":"shutdown","rpm":"0"}]}
.....
>>> {"type":"event","data":{"id":"id1","value": "ok","temp":"200F"}}
.....
>>> {"type":"event","data":{"id":"id2","value": "ok","rpm":"1010"}}
.....
```

