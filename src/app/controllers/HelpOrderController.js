import * as Yup from 'yup';
import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';
import Registration from '../models/Registration';

class HelpOrderController {
  async store(req, res) {
    const schema = Yup.object().shape({
      question: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;
    const { question } = req.body;

    const studentExists = await Student.findByPk(id);

    if (!studentExists) {
      return res.status(401).json({ error: 'Student not found' });
    }

    const checkStudentHasRegistration = await Registration.findOne({
      where: {
        student_id: id,
      },
    });

    if (!checkStudentHasRegistration) {
      return res
        .status(401)
        .json({ error: 'Students need a membership to create orders' });
    }
    if (!checkStudentHasRegistration.active) {
      return res
        .status(401)
        .json({ erro: 'Membership must be active to create orders' });
    }

    const newOrder = await HelpOrder.create({
      student_id: id,
      question,
    });

    const data = {
      id: newOrder.id,
      question: newOrder.question,
      student: {
        id: studentExists.id,
        name: studentExists.name,
      },
    };

    const ownerSocket = req.admin;

    if (ownerSocket) {
      req.io.to('admin').emit('new_order', data);
    }

    return res.json(newOrder);
  }
}

export default new HelpOrderController();
