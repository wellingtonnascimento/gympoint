import * as Yup from 'yup';
import { Op } from 'sequelize';

import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';

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

    // Verifying if the question exists
    const existingQuestion = await HelpOrder.findByPk(id);

    if (!existingQuestion) {
      return res.status(404).json({ err: 'Question not found' });
    }

    const { answer } = req.body;

    await existingQuestion.update({ answer, answer_at: Date.now() });
    await existingQuestion.save();

    return res.json(existingQuestion);
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
