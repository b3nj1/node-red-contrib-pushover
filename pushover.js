
module.exports = function(RED) {
    "use strict";
    var util = require('util');

    function PushoverNode(n) {
        RED.nodes.createNode(this,n);
        this.title = n.title;
        this.device = n.device;
        this.priority = n.priority;
        this.sound = n.sound;
        if (this.sound === '') { this.sound = null; }
        var credentials = this.credentials;
        if ((credentials) && (credentials.hasOwnProperty("token"))) { this.token = credentials.token; }
        else { this.error("No Pushover api token set"); }
        if ((credentials) && (credentials.hasOwnProperty("userKey"))) { this.userKey = credentials.userKey; }
        else { this.error("No Pushover user key set"); }
        var pusher = false;
        if (this.token && this.userKey) {
            pusher = new PushoverConfig({
                user: this.userKey,
                token: this.token,
                onerror: function(err) {
                    util.log('[pushover.js] Error: '+err);
                }
            });
        }
        var node = this;

        this.on("input",function(msg) {
            var titl = this.title || msg.topic || "Node-RED";
            var pri = this.priority || msg.priority || 0;
            var dev = this.device || msg.device;
            var sound = this.sound || msg.sound || null;
            var url = this.url || msg.url || null;
            var url_title = this.url_title || msg.url_title || null;
            if (isNaN(pri)) {pri=0;}
            if (pri > 2) {pri = 2;}
            if (pri < -2) {pri = -2;}
            if (typeof(msg.payload) === 'object') {
                msg.payload = JSON.stringify(msg.payload);
            }
            else { msg.payload = msg.payload.toString(); }
            if (pusher) {
                var pushmsg = {
                    message: msg.payload,
                    title: titl,
                    priority: pri,
                    retry: 30,
                    expire: 600
                };
                if (dev) { pushmsg.device = dev; }
                if (typeof(sound) === 'string') { pushmsg.sound = sound; }
                if (typeof(url) === 'string') { pushmsg.url = url; }
                if (typeof(url_title) === 'string') { pushmsg.url_title = url_title; }
                //node.log("Sending "+JSON.stringify(pushmsg));
                pusher.send( pushmsg, function(err, response) {
                    if (err) { node.error("Pushover Error: "+err); }
                    //console.log(response);
                });
            }
            else {
                node.warn("Pushover credentials not set.");
            }
        });
    }
    RED.nodes.registerType("pushover",PushoverNode,{
        credentials: {
            userKey: {type:"text"},
            token: {type: "text"}
        }
    });



    function PushoverConfig(n) {
        RED.nodes.createNode(this,n);
        this.name = n.name;
        this.userKey = this.credentials.userKey;
        this.token = this.credentials.token;
    }
    RED.nodes.registerType("pushover-config",PushoverConfig,{
        credentials: {
            userKey: {type:"text"},
            token: {type: "text"}
        },
    });
}