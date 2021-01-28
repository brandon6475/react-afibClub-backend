import Sequelize from 'sequelize';

import config from '../config';

import admin from './admin';
import adminLogin from './admin_login';
import user from './user';
import userLogin from './user_login';
import activation from './activation';
import feedback from './feedback';
import heartRate from './heart_rate';
import energy from './energy';
import exercise from './exercise';
import stand from './stand';
import weight from './weight';
import steps from './steps';
import sleep from './sleep';
import alcohol from './alcohol';
import bloodPressure from './blood_pressure';
import ecg from './ecg';
import post from './post';
import comment from './comment';
import reaction from './reaction';
import article from './article';
import good from './good';
import payment from './payment';
import logo from './logo';
import category from './category';
import ekg from './ekg';

import { initialize } from './seed';

let sequelize = new Sequelize(
  config.db_name,
  config.db_user,
  config.db_pass,
  {
    host: config.db_host,
    port: config.db_port,
    dialect: config.db_dialect,
    pool: {
      max: 20,
      min: 0,
      idle: 10000
    },
    logging: false,
  },
);

Sequelize.filter = (aggregation, filters, model) => {
  const filterFn = Array.isArray(filters)
    ? filters.length === 1
      ? filters[0]
      : Sequelize.and(...filters)
    : filters

  if (!filterFn) throw new Error('Missing filters!')
  if (!aggregation) throw new Error('Missing aggregation!')

  const query = sequelize.dialect.QueryGenerator.getWhereConditions(filterFn, model.name, model)
  const agg = sequelize.dialect.QueryGenerator.handleSequelizeMethod(aggregation, model.name, model)
  return Sequelize.literal(`${agg} FILTER (WHERE ${query})`)
}

Sequelize.Model.upsert = function (values, options) {
  const Model = this;
  return Model
    .findOne(options)
    .then(function(obj) {
      if(obj) { // update
        return obj.update(values);
      }
      else { // insert
        return Model.create(values);
      }
    })
}

const models = {};
models.Admin = admin(sequelize, Sequelize)
models.AdminLogin = adminLogin(sequelize, Sequelize)
models.User = user(sequelize, Sequelize)
models.UserLogin = userLogin(sequelize, Sequelize)
models.Activation = activation(sequelize, Sequelize)
models.Feedback = feedback(sequelize, Sequelize)
models.HeartRate = heartRate(sequelize, Sequelize)
models.Energy = energy(sequelize, Sequelize)
models.Exercise = exercise(sequelize, Sequelize)
models.Stand = stand(sequelize, Sequelize)
models.Weight = weight(sequelize, Sequelize)
models.Steps = steps(sequelize, Sequelize)
models.Sleep = sleep(sequelize, Sequelize)
models.Alcohol = alcohol(sequelize, Sequelize)
models.BloodPressure = bloodPressure(sequelize, Sequelize)
models.ECG = ecg(sequelize, Sequelize)
models.Post = post(sequelize, Sequelize)
models.Comment = comment(sequelize, Sequelize)
models.Reaction = reaction(sequelize, Sequelize)
models.Article = article(sequelize, Sequelize)
models.Good = good(sequelize, Sequelize)
models.Payment = payment(sequelize, Sequelize)
models.Logo = logo(sequelize, Sequelize)
models.Category = category(sequelize, Sequelize)
models.EKG = ekg(sequelize, Sequelize)

models.User.hasMany(models.Feedback, { as: 'feedbacks', foreignKey: 'doctor_id' })
models.Feedback.belongsTo(models.User, { as: 'doctor', foreignKey: 'doctor_id' })
models.User.hasMany(models.Feedback, { as: 'my_feedback', foreignKey: 'patient_id'})
models.Feedback.belongsTo(models.User, { as: 'patient', foreignKey: 'patient_id' })

models.User.hasMany(models.Comment, { as: 'comments', foreignKey: 'user_id' })
models.Comment.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' })

models.User.hasMany(models.Reaction, { as: 'reactions', foreignKey: 'user_id' })
models.Reaction.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' })

models.User.hasMany(models.Post, { as: 'posts', foreignKey: 'user_id' })
models.Post.belongsTo(models.User, { as: 'creator', foreignKey: 'user_id' })
models.Post.hasMany(models.Comment, { as: 'comments', foreignKey: 'post_id' })
models.Comment.belongsTo(models.Post, { foreignKey: 'post_id' })
models.Post.hasMany(models.Reaction, { as: 'likes', foreignKey: 'relation_id', constraints: false })
models.Post.hasMany(models.Reaction, { as: 'dislikes', foreignKey: 'relation_id', constraints: false })
models.Reaction.belongsTo(models.Post, { foreignKey: 'relation_id', constraints: false })

models.Admin.hasMany(models.Article, { as: 'articles', foreignKey: 'admin_id' })
models.Article.belongsTo(models.Admin, { as: 'creator', foreignKey: 'admin_id' })
models.Article.hasMany(models.Reaction, { as: 'likes', foreignKey: 'relation_id', constraints: false })
models.Article.hasMany(models.Reaction, { as: 'dislikes', foreignKey: 'relation_id', constraints: false })
models.Reaction.belongsTo(models.Article, { foreignKey: 'relation_id', constraints: false })

models.Admin.hasMany(models.Good, { as: 'goods', foreignKey: 'admin_id' })
models.Good.belongsTo(models.Admin, { as: 'creator', foreignKey: 'admin_id' })
models.Good.hasMany(models.Reaction, { as: 'likes', foreignKey: 'relation_id', constraints: false })
models.Good.hasMany(models.Reaction, { as: 'dislikes', foreignKey: 'relation_id', constraints: false })
models.Reaction.belongsTo(models.Good, { foreignKey: 'relation_id', constraints: false })

models.Comment.hasMany(models.Reaction, { as: 'likes', foreignKey: 'relation_id', constraints: false })
models.Comment.hasMany(models.Reaction, { as: 'dislikes', foreignKey: 'relation_id', constraints: false })
models.Reaction.belongsTo(models.Comment, { foreignKey: 'relation_id', constraints: false })

models.User.hasMany(models.Payment, { as: 'payments', foreignKey: 'user_id' })
models.Payment.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' })

Object.keys(models).forEach(key => {
  if ('associate' in models[key]) {
    models[key].associate(models);
  }
});

models.transaction = async (option) => {
  return await sequelize.transaction(option)
}

// seed initial data
sequelize.sync({force: false}).then(() => {
  initialize(models);
})

export { sequelize };

export default models;