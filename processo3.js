var app = require("http").createServer();
var io = require("socket.io")(app);
var ioc = require("socket.io-client");
var readline = require("readline");

const { port1, port2, port3, port4 } = require("./ports").ports;
const myPort = port3;
const basePorta = 3000;
const paraConectar = {
  primeiro: port1,
  segundo: port2,
  terceiro: port4
}
const idProcesso = myPort - basePorta;
const listaConectadosAMim = {};

var MYPROCESS = (function() {
  function MYPROCESS() {
    this.conexaoClienteProcesso1 = ioc.connect("http://localhost:" + paraConectar.primeiro, {
      query: { idProcesso: idProcesso }
    });
    this.conexaoClienteProcesso2 = ioc.connect("http://localhost:" + paraConectar.segundo, {
      query: { idProcesso: idProcesso }
    });
    this.conexaoClienteProcesso3 = ioc.connect("http://localhost:" + paraConectar.terceiro, {
      query: { idProcesso: idProcesso }
    });
  }

  MYPROCESS.prototype.initialize = function() {
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
          "Processo "+idProcesso+" recebendo de " +
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
      console.log("PROCESSO " + idProcesso +  " CONECTADO AO PROCESSO "+(paraConectar.primeiro - basePorta)+"!");
    });

    this.conexaoClienteProcesso2.on("connect", function() {
      console.log("PROCESSO " + idProcesso +  " CONECTADO AO PROCESSO "+(paraConectar.segundo - basePorta)+"!");
    });

    this.conexaoClienteProcesso3.on("connect", function() {
      console.log("PROCESSO " + idProcesso +  " CONECTADO AO PROCESSO "+(paraConectar.terceiro - basePorta)+"!");
    });
  };

  MYPROCESS.prototype.enviarMensagemProcesso1 = function(mensagem) {
    this.conexaoClienteProcesso1.emit("mensagem", {
      mensagem: mensagem,
      idProcesso
    });
  };

  MYPROCESS.prototype.enviarMensagemProcesso2 = function(mensagem) {
    this.conexaoClienteProcesso2.emit("mensagem", {
      mensagem: mensagem,
      idProcesso
    });
  };

  MYPROCESS.prototype.enviarMensagemProcesso3 = function(mensagem) {
    this.conexaoClienteProcesso3.emit("mensagem", {
      mensagem: mensagem,
      idProcesso
    });
  };

  return MYPROCESS;
})();

const processo = new MYPROCESS();
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
    processo.enviarMensagemProcesso3(ans);
  }
}
x();
