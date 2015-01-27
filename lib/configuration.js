var util=require("util");
var _ = require("underscore");

module.exports = Configuration;

function Configuration() {
    this.Web = new Configuration.Web()
    this.WebSocket = new Configuration.WebSocket();   
    if(process.argv.length==3) {
        var configfn=process.cwd()+"/"+process.argv[2];
        if((configfn=require.resolve(configfn))!=null) {
            var customconfig=new (require(configfn));
            var self=this;
            _.keys(customconfig).forEach(function(key) {
                _.extend(self[key],customconfig[key]);
            });
        }
    }
}

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

