import * as Yup from 'yup';
import Plans from '../models/Plans';

class PlansController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required().integer(),
      price: Yup.number().required().positive(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const titleExists = await Plans.findOne({
      where: { title: req.body.title },
    });

    if (titleExists)
      return res.status(400).json({ error: 'Title already exists.' });

    const priceExists = await Plans.findOne({
      where: { price: req.body.price },
    });

    if (priceExists) {
      return res.status(400).json({ error: 'Price already exists' });
    }

    const { title, duration, price } = await Plans.create(req.body);

    return res.json({ title, duration, price });
  }

  async index(req, res) {
    const plans = await Plans.findAll();

    return res.json(plans);
  }

  async show(req, res) {
    const { id } = req.params;

    const plan = await Plans.findByPk(id);

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
    const plan = await Plans.findByPk(req.params.id);

    if (!plan) {
      return res.status(401).json({
        error: 'Plan does not exist',
      });
    }

    const { title } = req.body;

    if (title && title !== plan.title) {
      const checkTitle = await Plans.findOne({
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
}

export default new PlansController();
