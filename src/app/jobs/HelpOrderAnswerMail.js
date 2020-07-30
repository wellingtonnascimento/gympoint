import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class HelpOrderAnswerMail {
  get key() {
    return 'HelpOrderAnswerMail';
  }

  async handle({ data }) {
    const { order, answer_at } = data;

    await Mail.sendMail({
      to: `${order.student.name} <${order.student.email}>`,
      subject: 'Resposta para seu pedido de ajuda na GymPoint',
      template: 'helpOrder',
      context: {
        student: order.student.name,
        question: order.question,
        answer: order.answer,
        answer_at: format(
          parseISO(answer_at),
          "'No Dia' dd 'de' MMMM',' H:mm 'Horas'",
          {
            locale: pt,
          }
        ),
      },

      // end_date: format(parseISO(end_date), "dd'/'MM'/'yy", {
      //   locale: pt,
    });
  }
}

export default new HelpOrderAnswerMail();
