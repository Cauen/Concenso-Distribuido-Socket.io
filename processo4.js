const { MYPROCESS } = require('./processos');
const { portas } = require("./configs");
const minhaPorta = portas[3];
const restoPortas = portas.filter(porta => porta !== minhaPorta);

const processo = new MYPROCESS(minhaPorta, restoPortas);
processo.abrirServidor();
processo.iniciarPerguntas();