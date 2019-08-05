var app = require("http").createServer();
var io = require("socket.io")(app);
var ioc = require("socket.io-client");
var readline = require("readline");

const { port1, port2, port3, port4 } = require("./ports").ports;
const myPort = port4;
const processoComErro = false;
const basePorta = 3000;
const paraConectar = {
  primeiro: port1,
  segundo: port2,
  terceiro: port3
};
const idProcesso = myPort - basePorta;
const listaSocketsConetadosAMim = {};
const listaConectadosIdProcesso = {};
let counter = 0;
let vetorDeDados = {};
let matrizDeDados = {};

function preencherVetorDeDados(pos, valor) {
  vetorDeDados[pos] = valor;

  const ids = [...Object.keys(listaConectadosIdProcesso), idProcesso];
  console.log("ids");
  console.log(ids);
  console.log("ARRAY ATUAL = ", vetorDeDados);
  let fim = true;
  ids.forEach(id => (vetorDeDados[id] ? "" : (fim = false)));
  if (fim) {
    console.log("ARRAY COMPLETA");
    enviarParaOResto(vetorDeDados);
    matrizDeDados[idProcesso] = vetorDeDados;
  }
}

function preencherMatriz(pos, vetor) {
  matrizDeDados[pos] = vetor;
  console.log('matrizDeDados');
  console.log(matrizDeDados);

  const ids = [...Object.keys(listaConectadosIdProcesso), idProcesso];
  let fim = true;
  ids.forEach(id => (matrizDeDados[id] ? "" : (fim = false)));
  if (fim) {
    // MATRIZ COMPLETA
    console.log("MATRIZ COMPLETA");
    console.log(ids);
    for (let i = 1; i <= ids.length; i++) {
      let hashTable = {};
      for (let j = 1; j <= ids.length; j++) {
        console.log("I",i, "J", j);
        let value = matrizDeDados[j][i];
        hashTable[value] ? (hashTable[value] += 1) : (hashTable[value] = 1);
      }
      console.log(hashTable);
    }
  }
}

var MYPROCESS = (function() {
  function MYPROCESS() {
    this.conexaoClienteProcesso1 = ioc.connect(
      "http://localhost:" + paraConectar.primeiro,
      {
        query: { idProcesso: idProcesso }
      }
    );
    this.conexaoClienteProcesso2 = ioc.connect(
      "http://localhost:" + paraConectar.segundo,
      {
        query: { idProcesso: idProcesso }
      }
    );
    this.conexaoClienteProcesso3 = ioc.connect(
      "http://localhost:" + paraConectar.terceiro,
      {
        query: { idProcesso: idProcesso }
      }
    );
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
      counter += 1;
      listaSocketsConetadosAMim[socket.id] = socket;
      listaConectadosIdProcesso[socket.idProcesso] = socket.idProcesso;

      socket.on("mensagem", function(data) {
        console.log(
          "Processo " +
            idProcesso +
            " recebendo de " +
            data.idProcesso +
            " a mensagem " +
            data.mensagem
        );

        if (typeof data.mensagem !== "object")
          // recebendo dado
          preencherVetorDeDados(data.idProcesso, data.mensagem);
        // Recebendo array completo
        else preencherMatriz(data.idProcesso, data.mensagem);
      });

      socket.on("disconnect", () => {
        console.log("DESCONECTANDO ");
        counter -= 1;
        delete listaSocketsConetadosAMim[socket.id];
        delete listaConectadosIdProcesso[socket.idProcesso];
      });
    });

    this.conexaoClienteProcesso1.on("connect", function() {
      console.log(
        "PROCESSO " +
          idProcesso +
          " CONECTADO AO PROCESSO " +
          (paraConectar.primeiro - basePorta) +
          "!"
      );
    });

    this.conexaoClienteProcesso2.on("connect", function() {
      console.log(
        "PROCESSO " +
          idProcesso +
          " CONECTADO AO PROCESSO " +
          (paraConectar.segundo - basePorta) +
          "!"
      );
    });

    this.conexaoClienteProcesso3.on("connect", function() {
      console.log(
        "PROCESSO " +
          idProcesso +
          " CONECTADO AO PROCESSO " +
          (paraConectar.terceiro - basePorta) +
          "!"
      );
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

function enviarParaOResto(mensagem) {
  if (typeof mensagem !== "object" && processoComErro) {
    // ENVINADO MENSAGEM COM ERRO
    processo.enviarMensagemProcesso1(mensagem + "Q");
    processo.enviarMensagemProcesso2(mensagem + "W");
    processo.enviarMensagemProcesso3(mensagem + "E");
  } else {
    processo.enviarMensagemProcesso1(mensagem);
    processo.enviarMensagemProcesso2(mensagem);
    processo.enviarMensagemProcesso3(mensagem);
  }
}

async function x() {
  while (true) {
    const ans = await askQuestion("O que você mandará?? ");
    preencherVetorDeDados(idProcesso, ans);
    enviarParaOResto(ans);
  }
}
x();
