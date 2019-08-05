var app = require("http").createServer();
var io = require("socket.io")(app);
var ioc = require("socket.io-client");
var readline = require("readline");

const { port1, port2, port3, port4 } = require("./ports").ports;
const myPort = port3;
const idProcesso = myPort - 3000;
const listaConectadosAMim = {};

var Processo3 = (function() {
  function Processo3() {
    this.conexaoClienteProcesso1 = ioc.connect("http://localhost:" + port1, {
      query: { idProcesso: 3 }
    });
    this.conexaoClienteProcesso2 = ioc.connect("http://localhost:" + port2, {
      query: { idProcesso: 3 }
    });
    this.conexaoClienteProcesso4 = ioc.connect("http://localhost:" + port4, {
      query: { idProcesso: 3 }
    });
  }

  Processo3.prototype.initialize = function() {
    io.listen(myPort);
    io.use(function(socket, next) {
      let idProcesso = socket.handshake.query.idProcesso;
      socket.idProcesso = idProcesso;
      next();
    });
    // RECEBENDO MENSAGENS NO PROCESSO 2
    io.on("connection", function(socket) {
      listaConectadosAMim[socket.id] = socket;
      socket.idProcesso = socket.on("mensagem", function(data) {
        console.log(
          "Processo 3 recebendo de " +
            data.idProcesso +
            " a mensagem " +
            data.mensagem
        );
      });

      socket.on("disconnect", () => {
        console.log("PROCESSO ");
        delete listaConectadosAMim[socket.id];
      });
    });

    this.conexaoClienteProcesso1.on("connect", function() {
      console.log("PROCCESS 3 CONNECTED WITH PROCCES 1!");
    });

    this.conexaoClienteProcesso2.on("connect", function() {
      console.log("PROCCESS 3 CONNECTED WITH PROCCES 2!");
    });

    this.conexaoClienteProcesso4.on("connect", function() {
      console.log("PROCCESS 3 CONNECTED WITH PROCCES 4!");
    });
  };

  Processo3.prototype.enviarMensagemProcesso1 = function(mensagem) {
    this.conexaoClienteProcesso1.emit("mensagem", {
      mensagem: mensagem,
      idProcesso
    });
  };

  Processo3.prototype.enviarMensagemProcesso2 = function(mensagem) {
    this.conexaoClienteProcesso2.emit("mensagem", {
      mensagem: mensagem,
      idProcesso
    });
  };

  Processo3.prototype.enviarMensagemProcesso4 = function(mensagem) {
    this.conexaoClienteProcesso4.emit("mensagem", {
      mensagem: mensagem,
      idProcesso
    });
  };

  return Processo3;
})();

const processo = new Processo3();
processo.initialize();

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve =>
    rl.question(query, ans => {
      rl.close();
      resolve(ans);
    })
  );
}

async function x() {
  while (true) {
    const ans = await askQuestion("O que você mandará?? ");
    processo.enviarMensagemProcesso1(ans);
    processo.enviarMensagemProcesso2(ans);
    processo.enviarMensagemProcesso4(ans);
  }
}
x();
