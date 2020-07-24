import { startOfDay, endOfDay, subDays } from 'date-fns';
import { Op } from 'sequelize';
import Checkin from '../models/Checkin';
import Registration from '../models/Registration';
import Student from '../models/Student';
import Plan from '../models/Plan';

class CheckinController {
  async store(req, res) {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Invalid ID.' });
    }

    const checkStudentExists = await Student.findByPk(id);

    if (!checkStudentExists) {
      return res.status(401).json({ error: 'Student not found' });
    }

    const checkStudentHasRegistration = await Registration.findOne({
      where: { student_id: id },
    });

    if (!checkStudentHasRegistration) {
      return res
        .status(401)
        .json({ error: 'Student need a registration to check-in' });
    }

    if (!checkStudentHasRegistration.active) {
      return res
        .status(401)
        .json({ error: 'Registration must be active to check-in' });
    }

    const checkCheckinToday = await Checkin.findOne({
      where: {
        student_id: id,
        createdAt: {
          [Op.between]: [startOfDay(new Date()), endOfDay(new Date())],
        },
      },
    });

    if (checkCheckinToday) {
      return res
        .status(401)
        .json({ error: 'You already did your check-in today' });
    }

    const checkins = await Checkin.findAll({
      where: {
        student_id: id,
        created_at: {
          [Op.between]: [subDays(new Date(), 7), new Date()],
        },
      },
    });

    if (checkins.length >= 5) {
      return res.status(400).json({
        error: 'Access Denied. You have reached 5 checkins in the last 7 days',
      });
    }

    const checkin = await Checkin.create({ student_id: id });

    const { name, email } = checkStudentExists;

    return res.json({
      name,
      email,
      checkin,
    });
  }

  async index(req, res) {
    const { page = 1 } = req.query;
    const { id } = req.params;
    const checkStudentExists = await Student.findByPk(id);

    if (!checkStudentExists) {
      return res.status(401).json({ error: 'Student not found' });
    }

    const checkStudentHasRegistration = await Registration.findOne({
      where: {
        student_id: id,
      },
      include: [
        {
          model: Plan,
          as: 'plan',
          attribute: ['title'],
        },
      ],
    });

    if (!checkStudentHasRegistration) {
      return res
        .status(401)
        .json({ error: 'Students need a registration to check-in' });
    }

    const { count, row: checkins } = await Checkin.findAndCountAll({
      where: {
        student_id: id,
      },
      order: [['createdAt', 'DESC']],
      limit: 10,
      offset: (page - 1) * 10,
    });

    return res.json({
      checkins,
      student: checkStudentExists,
      registration: checkStudentHasRegistration,
      count,
    });
  }
}

export default new CheckinController();
