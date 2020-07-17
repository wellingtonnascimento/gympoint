import Sequelize, { Model } from 'sequelize';

class Plans extends Model {
  static init(sequelize) {
    super.init(
      {
        title: Sequelize.STRING,
        price: Sequelize.FLOAT,
      },
      {
        sequelize,
      }
    );
    return this;
  }
}

export default Plans;
