import Students from '../models/Students';

class StudentsController {
  async store(req, res) {
    // const studentsExists = await Students.findOne({
    //   where: { email: req.body.email },
    // });

    // if (studentsExists) {
    //   return res.status(400).json({ error: 'Students already exists' });
    // }

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
