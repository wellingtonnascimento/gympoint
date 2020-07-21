import * as Yup from 'yup';
import { parseISO, addDays, format } from 'date-fns';
// import pt from 'date-fns/locale/pt';
import Registration from '../models/Registration';
import Plan from '../models/Plan';
import Student from '../models/Student';

import ConfirmationMail from '../jobs/ConfirmationMail';
import Queue from '../../lib/Queue';

class RegistrationController {
  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;

    if (!plan_id || !student_id) {
      return res
        .status(401)
        .json({ error: 'Plan ID or Student ID is invalid.' });
    }

    const registrationExists = await Registration.findOne({
      where: { student_id },
    });

    if (registrationExists) {
      return res
        .status(401)
        .json({ error: 'A registration with this student already exists' });
    }

    const planExists = await Plan.findOne({ where: { id: plan_id } });

    if (!planExists) {
      return res.status(400).json({ error: 'Plan not found.' });
    }

    const studentExists = await Student.findOne({
      where: { id: student_id },
    });

    if (!studentExists) {
      return res.status(400).json({ error: 'Student not found.' });
    }

    const { duration, price } = planExists;

    const end_date = format(
      addDays(parseISO(start_date), duration * 30),
      'yyyy-MM-dd'
    );

    const registration = await Registration.create({
      student_id,
      plan_id,
      start_date,
      end_date,
      price: price * duration,
    });

    await Queue.add(ConfirmationMail.key, {
      studentExists,
      planExists,
      start_date,
      end_date,
      price,
    });

    return res.json(registration);
  }
}

export default new RegistrationController();
