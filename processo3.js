const { MYPROCESS } = require('./processos');
const [ paraConectar1, paraConectar2, minhaPorta, paraConectar3 ] = require("./portas").portas;
const processoComErro = true;

const processo = new MYPROCESS(minhaPorta, paraConectar1, paraConectar2, paraConectar3, processoComErro);
processo.inicializar();
processo.iniciarPerguntas();