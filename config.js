

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

