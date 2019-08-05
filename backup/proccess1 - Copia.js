var app = require("http").createServer();
var io = require("socket.io")(app);
var ioc = require("socket.io-client");

const { port1, port2, port3, port4 } = require("./ports").ports;

var Proccess1 = (function() {
  function Proccess1() {
    console.log(port2);
    this.loginServerSocket = ioc.connect("http://localhost:" + port2, {
      reconnect: true
    });
  }

  Proccess1.prototype.initialize = function() {
    var self = this;

    io.listen(port1, () => console.log("OPEN SERVER"));
    // RECEBENDO MENSAGENS NO PROCESSO 1
    io.on("connection", function(socket) {});

    this.LoginServerResponses();
  };

  Proccess1.prototype.LoginServerResponses = function() {
    var self = this;
    this.loginServerSocket.on("connect", function() {
      console.log("PROCCESS 1 CONNECTED TO PROCCESS 2");
      // Try to login
      console.log("PROCCESSO 1 EMITIND MENSAGEM PRO PROCESSO 2: John Kennedy");
      self.loginServerSocket.emit("mensagem", "John Kennedy");
    });
  };

  return Proccess1;
})();

exports.Proccess1 = Proccess1;
