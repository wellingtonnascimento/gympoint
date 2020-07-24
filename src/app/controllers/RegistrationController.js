import * as Yup from 'yup';
import { parseISO, addDays, format, isBefore, endOfDay } from 'date-fns';
// import pt from 'date-fns/locale/pt';
import Registration from '../models/Registration';
import Plan from '../models/Plan';
import Student from '../models/Student';

import ConfirmationMail from '../jobs/ConfirmationMail';
import Queue from '../../lib/Queue';

class RegistrationController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const registrations = await Registration.findAll({
      order: ['start_date'],
      attribute: ['id', 'start_date', 'end_date', 'price', 'active'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Student,
          as: 'student',
          attribute: ['name', 'email', 'age'],
        },
        {
          model: Plan,
          as: 'plan',
          attribute: ['title', 'duration', 'price'],
        },
      ],
    });

    return res.json(registrations);
  }

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

    if (isBefore(endOfDay(parsedStartDate), new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const price = planExists.price * planExists.duration;

    const end_date = format(
      addDays(parseISO(start_date), planExists.duration * 30),
      'yyyy-MM-dd'
    );

    const registration = await Registration.create({
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
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

    if (registrationExists.active) {
      return res
        .status(400)
        .json({ error: 'Only inactive membership can be updated' });
    }

    if (start_date && isBefore(endOfDay(parsedStartDate), new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const planExists = await Plan.findOne({ where: { id: plan_id } });

    if (!planExists) {
      return res.status(400).json({ error: 'Plan not found.' });
    }

    const price = planExists.price * planExists.duration;

    const end_date = format(
      addDays(parseISO(start_date), planExists.duration * 30),
      'yyyy-MM-dd'
    );

    const updatedRegistration = await registrationExists.update({
      student_id: studentId,
      plan_id,
      start_date: parsedStartDate,
      end_date,
      price,
    });

    return res.json(updatedRegistration);
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
