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

    const planExists = await Plans.findOne({
      where: { title: req.body.title },
    });

    if (planExists)
      return res.status(400).json({ error: 'Plan already exists.' });

    const priceExists = await Plans.findOne({
      where: { price: req.body.price },
    });

    if (priceExists) {
      return res.status(400).json({ error: 'Price already exists' });
    }

    const { title, duration, price } = await Plans.create(req.body);

    return res.json({ title, duration, price });
  }
}

export default new PlansController();
