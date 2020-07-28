import * as Yup from 'yup';
import HelpOrder from '../models/HelpOrder';

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
}

export default new HelpAnswerController();
