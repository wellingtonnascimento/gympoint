import * as Yup from 'yup';
import { parseISO, addDays, format, isBefore, endOfDay } from 'date-fns';
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
    const parsedStartDate = parseISO(start_date);

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

    if (start_date && isBefore(endOfDay(parsedStartDate), new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const totalPrice = price * duration;

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
      totalPrice,
    });

    return res.json(registration);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      plan_id: Yup.number(),
      start_date: Yup.date(),
    });

    const { studentId } = req.params;

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const { plan_id, start_date } = req.body;
    const parsedStartDate = parseISO(start_date);

    /**
     * Search for the student registration
     */

    const registrationExists = await Registration.findOne({
      where: {
        student_id: studentId,
      },
    });

    if (!registrationExists) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    if (start_date && isBefore(endOfDay(parsedStartDate), new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const planExists = await Plan.findOne({ where: { id: plan_id } });

    if (!planExists) {
      return res.status(400).json({ error: 'Plan not found.' });
    }

    const { duration, price } = planExists;

    const end_date = format(
      addDays(parseISO(start_date), duration * 30),
      'yyyy-MM-dd'
    );

    const { active } = await registrationExists.update({
      student_id: studentId,
      plan_id,
      start_date,
      end_date,
      price: price * duration,
    });

    return res.json({
      plan_id,
      start_date,
      end_date,
      active,
      price: price * duration,
    });
  }

  async delete(req, res) {
    const { studentId } = req.params;

    const registration = await Registration.findOne({
      where: {
        student_id: studentId,
      },
    });

    if (!registration) {
      return res.status(400).json({ error: 'Student membership not found' });
    }

    await registration.destroy();

    return res.status(204).send();
  }
}

export default new RegistrationController();
