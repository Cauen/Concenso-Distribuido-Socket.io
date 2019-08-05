var app = require("http").createServer();
var io = require("socket.io")(app);
var ioc = require("socket.io-client");
var readline = require("readline");
const { tempoParaExpulsar } = require("./configs");

function MYPROCESS(minhaPorta, paraConectarVetor, processoComErro) {
  this.basePorta = 3000;
  this.minhaPorta = minhaPorta;
  this.idProcesso = minhaPorta - this.basePorta;
  this.processoComErro = processoComErro;
  this.listaSocketsConetadosAMim = {};
  this.vetorDeDados = {};
  this.matrizDeDados = {};
  this.timeOut;

  // Gerando conexões de cliente -> servidores a conectar
  this.consClienteServidor = {};
  paraConectarVetor.forEach(port => {
    const idProcesso = port - this.basePorta;
    let conexaoCliente = ioc.connect("http://localhost:" + port, {
      query: { idProcesso: this.idProcesso }
    });
    this.consClienteServidor[idProcesso] = conexaoCliente;
    conexaoCliente.on("msg", msg => {
      log("BATATA DOCE");
    });
    conexaoCliente.on("msg", data => {
      console.log(
        "Svr " + this.idProcesso + " recebe " + data + " de " + idProcesso
      );
      this.preencherVetorDeDados(idProcesso, data);
    });

    conexaoCliente.on("vetor", data => {
      console.log(
        "Svr " + this.idProcesso + " rec vet" + data + " de " + idProcesso
      );
      this.preencherMatriz(idProcesso, data);
    });
  });

  MYPROCESS.prototype.abrirServidor = () => {
    this.timeOut = setTimeout(() => {
      paraConectarVetor.forEach(port => {
        const thisProcID = port - this.basePorta;
        if (!this.vetorDeDados[thisProcID]) {
          console.log(
            "NÃO RECEBEU NENHUMA MENSAGEM DO PROCESSO " +
              thisProcID +
              " no últimos " +
              tempoParaExpulsar / 1000 +
              "segundos"
          );
          if (this.listaSocketsConetadosAMim[thisProcID]) {
            log('Desconectando processo ' + thisProcID);
            this.listaSocketsConetadosAMim[thisProcID].disconnect();
            this.consClienteServidor[thisProcID].disconnect();
          } else {
            log("Processo " + thisProcID + " não está sequer conectado");
          }
        }
      });
      
      this.testarVetor();
    }, tempoParaExpulsar);

    io.listen(this.minhaPorta);
    io.use((socket, next) => {
      let idProcesso = socket.handshake.query.idProcesso;
      socket.idProcesso = idProcesso;
      next();
    });
    // Conexão sendo recebidas pelo servidor
    io.on("connection", socket => {
      const myProcID = this.idProcesso;
      const procID = socket.idProcesso;
      this.listaSocketsConetadosAMim[procID] = socket;
      log("Svr " + myProcID + " recebendo conexão de CLIENTE " + procID);

      socket.on("disconnect", () => {
        log("Svr " + myProcID + " perdeu conexão de CLIENTE " + procID);
        delete this.listaSocketsConetadosAMim[procID];
      });
    });
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

  this.preencherVetorDeDados = (pos, valor) => {
    console.log("PREENCHENDO VETOR");
    this.vetorDeDados[pos] = valor;

    this.testarVetor();
  };

  this.testarVetor = () => {
    const ids = [
      ...Object.keys(this.listaSocketsConetadosAMim),
      this.idProcesso
    ];
    log("ids");
    log(ids);
    log("VETOR ATUAL");
    log(this.vetorDeDados);
    let fim = true;
    ids.forEach(id => (this.vetorDeDados[id] ? "" : (fim = false)));
    if (fim) {
      log("VETOR COMPLETA");
      this.emitParaClientes("vetor", this.vetorDeDados);
      this.preencherMatriz(this.idProcesso,this.vetorDeDados);
    }
  }

  this.preencherMatriz = (pos, vetor) => {
    this.matrizDeDados[pos] = vetor;
    log("this.matrizDeDados");
    log(this.matrizDeDados);

    const ids = [
      ...Object.keys(this.listaSocketsConetadosAMim),
      this.idProcesso
    ];
    let fim = true;
    ids.forEach(id => (this.matrizDeDados[id] ? "" : (fim = false)));
    if (fim) {
      // MATRIZ COMPLETA
      log("MATRIZ COMPLETA!");
      log(ids);
      let ERRORCOUNTER = 0;
      for (let i = 1; i <= ids.length; i++) {
        let hashTable = {};
        for (let j = 1; j <= ids.length; j++) {
          log("I", i, "J", j);
          let value = this.matrizDeDados[j][i];
          hashTable[value] ? (hashTable[value] += 1) : (hashTable[value] = 1);
        }
        log(hashTable);
        let recebidos = Object.values(hashTable);
        let processoOK = Math.max(recebidos) >= Math.floor(ids.length) / 2 + 1;
        log("PROCESSO OK???");
        log(processoOK);

        if (!processoOK) {
          ERRORCOUNTER += 1;
          log("PROCESSO " + i + " com erro!");
          if (this.consClienteServidor[i])
            this.consClienteServidor[i].disconnect();
          if (this.listaSocketsConetadosAMim[i])
            this.listaSocketsConetadosAMim[i].disconnect();
        }
      }
      if (ERRORCOUNTER <= (ids.length-1)/3 )
        log("PROCESSO PODE CONTINUAR");
      else
        log("PROCESSO NÃO PODE CONTINUAR, ERROS DEMAIS");
      log("PROCESSOS AINDA CONECTADOS");
      Object.entries(this.consClienteServidor).forEach(connection => {
        log(connection[0] + " está conectado? " + connection[1].connected);
      });
      this.limparDados();
    } else {
      log("MATRIZ NÃO COMPLETA");
      log(this.matrizDeDados);
    }
  };

  this.emitParaClientes = (endpoint, mensagem) => {
    const vetorClientes = Object.values(this.listaSocketsConetadosAMim);
    vetorClientes.forEach(thisSocket => {
      log(
        "Enviando mensagem pro cliente " +
          thisSocket.idProcesso +
          ": " +
          mensagem
      );
      thisSocket.emit(endpoint, mensagem);
    });
  };

  this.limparDados = () => {
    this.vetorDeDados = {};
    this.matrizDeDados = {};
    clearInterval(this.timeOut);
  };

  this.enviarDigitadoPeloProcesso = mensagem => {
    // SE FOR OBJETO, É ENVIO DE VETOR, SE NÃO, É ENVIO DE MENSAGEM
    const PROCESSOCOMERRO = mensagem[0] === '-';
    if (PROCESSOCOMERRO) {
      // ENVINADO MENSAGEM COM ERRO
      Object.values(this.listaSocketsConetadosAMim).forEach(thisSocket => {
        let mensagemProblematica = mensagem + Math.random();
        log(
          "Enviando mensagem pro cliente " +
            thisSocket.idProcesso +
            ": " +
            mensagemProblematica
        );
        thisSocket.emit("msg", mensagemProblematica);
      });
    } else {
      this.emitParaClientes("msg", mensagem);
    }
  };

  MYPROCESS.prototype.iniciarPerguntas = async () => {
    while (true) {
      const ans = await perguntarAoProcesso("O que você mandará?? ");
      this.preencherVetorDeDados(this.idProcesso, ans);
      this.enviarDigitadoPeloProcesso(ans);
    }
  };
}

let log = console.log;

module.exports.MYPROCESS = MYPROCESS;
