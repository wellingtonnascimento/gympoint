import * as Yup from 'yup';
import Students from '../models/Students';

class StudentsController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().required(),
      idade: Yup.number().required().max(100),
      peso: Yup.number().required().positive().max(250),
      altura: Yup.number().required().positive(),
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

  async update(req, res) {
    const { id } = req.params;
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      idade: Yup.number().positive().max(100),
      peso: Yup.number().positive().positive().max(250),
      altura: Yup.number().positive(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const studentExists = await Students.findOne({ where: { id } });

    if (!studentExists) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    if (req.body.email && req.body.email !== studentExists.email) {
      const studentEmailExists = await Students.findOne({
        where: { email: req.body.email },
      });

      if (studentEmailExists) {
        return res.status(400).json({ error: 'Student already email exists.' });
      }
    }

    const { name, email, idade, peso, altura } = await studentExists.update(
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
