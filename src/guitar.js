import Bluebird, { reject } from 'bluebird';
import agent from 'superagent';
import promisifyAgent from 'superagent-promise';

const request = promisifyAgent(agent, Bluebird);
const route = path => `https://api.totalvoice.com.br${path}`;

const guitarInText = 'Tenguilen Telengui Tengui - Toca Cadu\n'
    + 'Voce ouviu o guitarra humana';

const sms = (to, token) => request.post(route('/sms'))
    .set('Access-Token', token)
    .set('Accept', 'application/json')
    .send({ numero_destino: to, mensagem: guitarInText });

const call = (from, to, token) => request.post(route('/composto'))
    .set('Access-Token', token)
    .set('Accept', 'application/json')
    .send({
        numero_destino: to,
        dados: [
            {
                acao: 'audio',
                acao_dados: {
                    url_audio: 'https://github.com/kallklen/human-guitar/raw/master/resources/guitarra_humana.mp3'
                }
            }
        ],
        bina: from
    });

export default function guitar(args) {
    if (!/^[a-f0-9]{32}$/.test(args.token)) {
        return reject(new Error('Token inválido. Obtenha um em https://totalvoice.com.br'));
    }

    if (!/^[0-9]{10,11}$/.test(args.para)) {
        return reject(new Error('Número de telefone inválido'));
    }

    const action = args.sms
        ? sms(args.para, args.token)
        : call(args.de, args.para, args.token);

    return action
        .catch(err => {
            if (err.status === 405 || err.status === 403) {
                return reject(new Error((err.body || err.response.body).mensagem));
            }

            return reject(err);
        });
}
