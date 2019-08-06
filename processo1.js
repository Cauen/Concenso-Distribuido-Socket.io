const { MYPROCESS } = require('./processos');
const { portas, enderecos } = require("./configs");
const minhaPorta = portas[0];
const meuEndereco = enderecos[0];
const restoPortas = portas.filter(porta => porta !== minhaPorta);

const processo = new MYPROCESS(meuEndereco, minhaPorta, restoPortas);
processo.abrirServidor();
processo.iniciarPerguntas();