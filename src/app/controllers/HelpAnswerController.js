import * as Yup from 'yup';
import { Op } from 'sequelize';

import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';
import Queue from '../../lib/Queue';
import HelpOrderAnswerMail from '../jobs/HelpOrderAnswerMail';

class HelpAnswerController {
  async store(req, res) {
    const schema = Yup.object().shape({
      answer: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const { id } = req.params;

    // Validating question id
    if (!id) {
      return res.status(400).json({ err: 'Question id not provided' });
    }

    const { answer } = req.body;

    const order = await HelpOrder.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ err: 'Question not found' });
    }

    if (order && order.answer) {
      return res.status(401).json({
        error: 'This order was already answered',
      });
    }

    await order.update({ answer, answer_at: Date.now() });
    await order.save();

    const { answer_at } = order;

    await Queue.add(HelpOrderAnswerMail.key, {
      order,
      answer_at,
    });

    return res.json(order);
  }

  async index(req, res) {
    const { page = 1 } = req.query;

    const pendingQuestion = await HelpOrder.findAll({
      where: { answer: { [Op.eq]: null } },
      atributes: ['id', 'question', 'answer', 'answer_at'],
      include: [
        {
          model: Student,
          as: 'student',
          atributes: ['id', 'name', 'email', 'weight', 'height'],
        },
      ],
      offset: (page - 1) * 10,
      limit: 10,
    });

    return res.json(pendingQuestion);
  }
}

export default new HelpAnswerController();
