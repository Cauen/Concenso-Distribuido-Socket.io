var app = require("http").createServer();
var io = require("socket.io")(app);
var ioc = require("socket.io-client");

const { port1, port2, port3, port4 } = require("./ports").ports;

var Proccess2 = (function() {
  function Proccess2() {
    this.proccess1ConnectionReception = ioc.connect(
      "http://localhost:" + port1,
      {
        reconnect: true
      }
    );
  }

  Proccess2.prototype.initialize = function() {
    var self = this;

    io.listen(port2);
    io.use(function(socket, next) {
      let idProcesso = socket.handshake.query.idProcesso;
      socket.idProcesso = idProcesso;
      next();
    });

    // RECEBENDO MENSAGENS NO PROCESSO 2
    io.on("connection", function(socket) {
      console.log("PROCESSO CONECTADO " + socket.idProcesso);

      socket.on("mensagem", function(data) {
        console.log(
          "Processo 2 recebendo de " +
            data.idProcesso +
            " a mensagem " +
            data.mensagem
        );
      });
    });

    // Conecta com processo 1
    this.proccess1ConnectionReception.on("connect", function() {
      console.log("PROCCESS 2 CONNECTED WITH PROCCES 1!");
    });
  };

  return Proccess2;
})();

exports.Proccess2 = Proccess2;
