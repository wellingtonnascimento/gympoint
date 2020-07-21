import * as Yup from 'yup';
import Plan from '../models/Plan';

class PlanController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required().integer(),
      price: Yup.number().required().positive(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const titleExists = await Plan.findOne({
      where: { title: req.body.title },
    });

    if (titleExists)
      return res.status(400).json({ error: 'Title already exists.' });

    const priceExists = await Plan.findOne({
      where: { price: req.body.price },
    });

    if (priceExists) {
      return res.status(400).json({ error: 'Price already exists' });
    }

    const { title, duration, price } = await Plan.create(req.body);

    return res.json({ title, duration, price });
  }

  async index(req, res) {
    const plan = await Plan.findAll();

    return res.json(plan);
  }

  async show(req, res) {
    const { id } = req.params;

    const plan = await Plan.findByPk(id);

    return res.json(plan);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required().integer(),
      price: Yup.number().required().positive(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const plan = await Plan.findByPk(req.params.id);

    if (!plan) {
      return res.status(401).json({
        error: 'Plan does not exist',
      });
    }

    const { title } = req.body;

    if (title && title !== plan.title) {
      const checkTitle = await Plan.findOne({
        where: { title },
      });

      if (checkTitle) {
        return res.status(401).json({
          error: 'title already exists',
        });
      }
    }

    const { duration, price } = await plan.update(req.body);

    return res.json({
      title,
      duration,
      price,
    });
  }

  async delete(req, res) {
    const plan = await Plan.findByPk(req.params.id);

    if (!plan) {
      return res.status(400).json({ error: 'Plan not found.' });
    }

    await plan.destroy();

    return res.status(204).send();
  }
}

export default new PlanController();
