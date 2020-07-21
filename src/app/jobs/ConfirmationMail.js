import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class ConfirmationMail {
  // Returning a unique key
  get key() {
    return 'ConfirmationMail';
  }

  async handle({ data }) {
    const {
      studentExists,
      planExists,
      start_date,
      end_date,
      totalPrice,
    } = data;

    await Mail.sendMail({
      to: `${studentExists.name} <${studentExists.email}>`,
      subject: 'Matricula realizada com sucesso',
      template: 'confirmation',
      context: {
        student: studentExists.name,
        plan_title: planExists.title,
        totalPrice,
        plan_duration: planExists.duration,
        start_date: format(parseISO(start_date), "dd'/'MM'/'yy", {
          locale: pt,
        }),
        end_date: format(parseISO(end_date), "dd'/'MM'/'yy", {
          locale: pt,
        }),
      },
    });
  }
}

export default new ConfirmationMail();
