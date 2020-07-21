import * as Yup from 'yup';
import { addMonths, parseISO, isBefore, isAfter, endOfDay } from 'date-fns';
import Registration from '../models/Registration';
import Plan from '../models/Plans';
import Student from '../models/Students';

import ConfirmationMail from '../jobs/ConfirmationMail';
import Queue from '../../lib/Queue';

class RegistrationController {
  async store(req, res) {
    const schema = Yup.object().shape({
      start_date: Yup.date().required(),
      plan_id: Yup.number().required(),
      student_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const { start_date, plan_id, student_id } = req.body;
    const parsedStartDate = parseISO(start_date);

    const checkPlanExists = await Plan.findByPk(plan_id);

    if (!checkPlanExists) {
      return res.status(401).json({ error: 'Plan not found' });
    }

    const checkStudentExists = await Student.findByPk(student_id);

    if (!checkStudentExists) {
      return res.status(401).json({ error: 'Student not found' });
    }

    const checkStudentHasRegistration = await Registration.findOne({
      where: {
        student_id,
      },
    });

    if (
      checkStudentHasRegistration &&
      (checkStudentHasRegistration.active ||
        isAfter(
          endOfDay(checkStudentHasRegistration.start_date),
          endOfDay(new Date())
        ))
    ) {
      return res
        .status(400)
        .json({ error: 'Student already has a active membership' });
    }

    if (isBefore(endOfDay(parsedStartDate), new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const end_date = addMonths(parsedStartDate, checkPlanExists.duration);
    const price = checkPlanExists.price * checkPlanExists.duration;

    const registration = await Registration.create({
      student_id,
      plan_id,
      start_date: parsedStartDate,
      end_date,
      price,
    });
    const registrationInfo = await Registration.findByPk(registration.id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['title'],
        },
      ],
    });

    if (process.env.NODE_ENV !== 'test') {
      await Queue.add(ConfirmationMail.key, {
        registrationInfo,
      });
    }

    return res.json(registrationInfo);
  }
}

export default new RegistrationController();
