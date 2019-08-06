const { MYPROCESS } = require('./processos');
const { portas, enderecos } = require("./configs");
const minhaPorta = portas[3];
const minhaEndereco = enderecos[3];
const restoPortas = portas.filter(porta => porta !== minhaPorta);

const processo = new MYPROCESS(minhaEndereco, minhaPorta, restoPortas);
processo.abrirServidor();
processo.iniciarPerguntas();