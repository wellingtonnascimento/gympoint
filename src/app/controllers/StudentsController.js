import * as Yup from 'yup';
import Students from '../models/Students';

class StudentsController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().required(),
      idade: Yup.number().required(),
      peso: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const studentsExists = await Students.findOne({
      where: { email: req.body.email },
    });

    if (studentsExists) {
      return res.status(400).json({ error: 'Students already exists' });
    }

    const { id, name, email, idade, peso, altura } = await Students.create(
      req.body
    );
    return res.json({
      id,
      name,
      email,
      idade,
      peso,
      altura,
    });
  }
}

export default new StudentsController();
