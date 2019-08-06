const { MYPROCESS } = require('./processos');
const { acessos } = require("./configs");
const meuAcesso = acessos[3];
const minhaPorta = meuAcesso.port;
const restoAcessos = acessos.filter(acesso => acesso !== meuAcesso);

const processo = new MYPROCESS(minhaPorta, restoAcessos);
processo.abrirServidor();
processo.iniciarPerguntas();