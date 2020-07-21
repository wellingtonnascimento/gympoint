import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class ConfirmationMail {
  get key() {
    return 'ConfirmationMail';
  }

  async handle({ data }) {
    const { registrationInfo } = data;

    await Mail.sendMail({
      to: `${registrationInfo.student.name} <${registrationInfo.student.email}>`,
      subject: 'Matricula realizada com sucesso',
      template: 'confirmation',
      context: {
        student: registrationInfo.student.name,
        start_date: format(
          parseISO(registrationInfo.start_date),
          "dd 'de' MMMM 'de' yyyy",
          {
            locale: pt,
          }
        ),
        id: registrationInfo.student.id,
        plan: registrationInfo.plan.title,
        price: registrationInfo.price,
        duration: format(
          parseISO(registrationInfo.end_date),
          "'Até dia' dd 'de' MMMM 'de' yyyy",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new ConfirmationMail();
