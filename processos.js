var app = require("http").createServer();
var io = require("socket.io")(app);
var ioc = require("socket.io-client");
var readline = require("readline");

const [ minhaPorta, paraConectar1, paraConectar2, paraConectar3 ] = require("./portas").portas;
const processoComErro = false;


var MYPROCESS = (function() {
  function MYPROCESS(minhaPorta, paraConectar1, paraConectar2, paraConectar3, processoComErro) {
    
    this.basePorta = 3000;
    this.minhaPorta = minhaPorta;
    this.idProcesso = minhaPorta - this.basePorta;
    this.paraConectar1 = paraConectar1;
    this.paraConectar2 = paraConectar2;
    this.paraConectar3 = paraConectar3;
    this.processoComErro = processoComErro;
    this.listaSocketsConetadosAMim = {};
    this.listaConectadosIdProcesso = {};
    this.counter = 0;
    this.vetorDeDados = {};
    this.matrizDeDados = {};
  
    this.conexaoClienteProcesso1 = ioc.connect(
      "http://localhost:" + this.paraConectar1,
      {
        query: { idProcesso: this.idProcesso }
      }
    );
    this.conexaoClienteProcesso2 = ioc.connect(
      "http://localhost:" + this.paraConectar2,
      {
        query: { idProcesso: this.idProcesso }
      }
    );
    this.conexaoClienteProcesso3 = ioc.connect(
      "http://localhost:" + this.paraConectar3,
      {
        query: { idProcesso: this.idProcesso }
      }
    );
  }

  MYPROCESS.prototype.inicializar = function() {
    console.log(this.x);
    io.listen(this.minhaPorta);
    io.use(function(socket, next) {
      let idProcesso = socket.handshake.query.idProcesso;
      socket.idProcesso = idProcesso;
      next();
    });
    // RECEBENDO MENSAGENS NO PROCESSO 2
    io.on("connection", function(socket) {
      this.counter += 1;
      this.listaSocketsConetadosAMim[socket.id] = socket;
      this.listaConectadosIdProcesso[socket.idProcesso] = socket.idProcesso;

      socket.on("mensagem", function(data) {
        console.log(
          "Processo " +
            this.idProcesso +
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
        this.counter -= 1;
        delete this.listaSocketsConetadosAMim[socket.id];
        delete this.listaConectadosIdProcesso[socket.idProcesso];
      });
    });

    this.conexaoClienteProcesso1.on("connect", function() {
      console.log(
        "PROCESSO " +
          this.idProcesso +
          " CONECTADO AO PROCESSO " +
          (this.paraConectar1 - this.basePorta) +
          "!"
      );
    });

    this.conexaoClienteProcesso2.on("connect", function() {
      console.log(
        "PROCESSO " +
          this.idProcesso +
          " CONECTADO AO PROCESSO " +
          (this.paraConectar2 - this.basePorta) +
          "!"
      );
    });

    this.conexaoClienteProcesso3.on("connect", function() {
      console.log(
        "PROCESSO " +
          this.idProcesso +
          " CONECTADO AO PROCESSO " +
          (this.paraConectar3 - this.basePorta) +
          "!"
      );
    });
  };

  const enviarMensagemProcesso1 = function(mensagem) {
    if (this.conexaoClienteProcesso1)
    this.conexaoClienteProcesso1.emit("mensagem", {
      mensagem: mensagem,
      idProcesso: this.idProcesso
    });
    else console.log("PROCESSO 1 NÃO CONECTADO");
  };

  const enviarMensagemProcesso2 = function(mensagem) {
    if (this.conexaoClienteProcesso2)
    this.conexaoClienteProcesso2.emit("mensagem", {
      mensagem: mensagem,
      idProcesso: this.idProcesso
    });
    else console.log("PROCESSO 2 NÃO CONECTADO");
  };

  const enviarMensagemProcesso3 = function(mensagem) {
    if (this.conexaoClienteProcesso3)
    this.conexaoClienteProcesso3.emit("mensagem", {
      mensagem: mensagem,
      idProcesso: this.idProcesso
    });
    else console.log("PROCESSO 3 NÃO CONECTADO");
  };

  async function perguntarAoProcesso(query) {
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

  MYPROCESS.prototype.preencherVetorDeDados = function preencherVetorDeDados(pos, valor) {
    this.vetorDeDados[pos] = valor;
  
    const ids = [...Object.keys(this.listaConectadosIdProcesso), this.idProcesso];
    console.log("ids");
    console.log(ids);
    console.log("ARRAY ATUAL = ", this.vetorDeDados);
    let fim = true;
    ids.forEach(id => (this.vetorDeDados[id] ? "" : (fim = false)));
    if (fim) {
      console.log("ARRAY COMPLETA");
      enviarParaOResto(this.vetorDeDados);
      this.matrizDeDados[this.idProcesso] = this.vetorDeDados;
    }
  }
  
  function preencherMatriz(pos, vetor) {
    this.matrizDeDados[pos] = vetor;
    console.log('this.matrizDeDados');
    console.log(this.matrizDeDados);
  
    const ids = [...Object.keys(this.listaConectadosIdProcesso), this.idProcesso];
    let fim = true;
    ids.forEach(id => (this.matrizDeDados[id] ? "" : (fim = false)));
    if (fim) {
      // MATRIZ COMPLETA
      console.log("MATRIZ COMPLETA");
      console.log(ids);
      for (let i = 1; i <= ids.length; i++) {
        let hashTable = {};
        for (let j = 1; j <= ids.length; j++) {
          console.log("I",i, "J", j);
          let value = this.matrizDeDados[j][i];
          hashTable[value] ? (hashTable[value] += 1) : (hashTable[value] = 1);
        }
        console.log(hashTable);
      }
    }
  }
  
  function enviarParaOResto(mensagem) {
    // SE FOR OBJETO, É ENVIO DE VETOR, SE NÃO, É ENVIO DE MENSAGEM
    if (typeof mensagem !== "object" && this.processoComErro) {
      // ENVINADO MENSAGEM COM ERRO
      enviarMensagemProcesso1(mensagem + "Q");
      enviarMensagemProcesso2(mensagem + "W");
      enviarMensagemProcesso3(mensagem + "E");
    } else {
      enviarMensagemProcesso1(mensagem);
      enviarMensagemProcesso2(mensagem);
      enviarMensagemProcesso3(mensagem);
    }
  }
  
  MYPROCESS.prototype.iniciarPerguntas = async function iniciarPerguntas() {
    while (true) {
      const ans = await perguntarAoProcesso("O que você mandará?? ");
      this.preencherVetorDeDados(this.idProcesso, ans);
      enviarParaOResto(ans);
    }
  }

  return MYPROCESS;
})();


const processo = new MYPROCESS(minhaPorta, paraConectar1, paraConectar2, paraConectar3, processoComErro);
processo.inicializar();
processo.iniciarPerguntas();