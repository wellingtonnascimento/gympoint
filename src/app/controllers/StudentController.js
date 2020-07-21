import * as Yup from 'yup';
import { Op } from 'sequelize';

import Student from '../models/Student';

class StudentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      age: Yup.number().required().max(115),
      weight: Yup.number().required().positive().max(250),
      height: Yup.number().required().positive(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const studentExists = await Student.findOne({
      where: { email: req.body.email },
    });

    if (studentExists) {
      return res.status(400).json({ error: 'Student already exists' });
    }

    const { id, name, email, age, weight, height } = await Student.create(
      req.body
    );
    return res.json({
      id,
      name,
      email,
      age,
      weight,
      height,
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

    const studentExists = await Student.findOne({ where: { id } });

    if (!studentExists) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    if (req.body.email && req.body.email !== studentExists.email) {
      const studentEmailExists = await Student.findOne({
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

  async index(req, res) {
    const { page, filter } = req.query;

    if (filter || page) {
      if (!page) {
        const student = await Student.findAll({
          where: {
            name: {
              [Op.iLike]: `%${filter}%`,
            },
          },
          order: ['name'],
        });

        return res.json(student);
      }

      const { count, rows: student } = await Student.findAndCountAll({
        where: {
          name: {
            [Op.iLike]: `%${filter}%`,
          },
        },
        order: ['name'],
        limit: 10,
        offset: (page - 1) * 10,
      });

      return res.json({ student, count });
    }

    const student = await Student.findAll({
      order: ['name'],
    });

    return res.json(student);
  }

  async show(req, res) {
    const { id } = req.params;

    const student = await Student.findByPk(id);

    return res.json(student);
  }

  async delete(req, res) {
    const { id } = req.params;

    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(400).json({ error: 'Student not found.' });
    }

    await student.destroy();

    return res.status(204).send();
  }
}

export default new StudentController();
