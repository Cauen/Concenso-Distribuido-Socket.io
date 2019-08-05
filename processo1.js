const { MYPROCESS } = require('./processos');
const [ minhaPorta, paraConectar1, paraConectar2, paraConectar3 ] = require("./portas").portas;
const processoComErro = false;

const processo = new MYPROCESS(minhaPorta, paraConectar1, paraConectar2, paraConectar3, processoComErro);
processo.inicializar();
processo.iniciarPerguntas();