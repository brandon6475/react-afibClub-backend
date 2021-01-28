import { Router } from 'express';
import Sequelize from 'sequelize';
import Joi from '@hapi/joi';
import models from '../../model';
import config from '../../config';
import logger from '../../middleware/logger';
import stripe from '../../middleware/stripe';
import { db } from '../../middleware/firestore';

const Op = Sequelize.Op;

const router = Router();

router.get('/', async (req, res) => {
  const users = await models.User.findAll({
    nest: true,
    raw: true,
    attributes: { exclude: ['facebook_id', 'google_id', 'apple_id', 'password', 'salt'] },
    where: { 
      status: { [Op.lt]: 3 }
    },
    order: [['id', 'ASC']]
  });
  res.status(200).send({
    data: users
  });
});

router.post('/modify/:id', async (req, res) => {
  const { id } = req.params;
  const { value } = req.body;
  const user_id = id;
  try {
    let user = await models.User.findByPk(id);
    await models.User.update({ status: value }, { where: { id } });
    if (value === 3) {
      let posts = await models.Post.findAll({ where: { user_id }});

      // delete posts
      for (let item of posts) {
        await models.Comment.destroy({ where: { post_id: item.id }});
        await models.Reaction.destroy({ where: { relation_id: item.id, type: 0 }});
      }
      models.Post.destroy({ where: { user_id }});
      models.Reaction.destroy({ where: { user_id }});
      models.Comment.destroy({ where: { user_id }});
      models.Feedback.destroy({ where: { user_id }});
      models.Payment.destroy({ where: { user_id }});

      // delete health datas
      models.Alcohol.destroy({ where: { user_id }});
      models.BloodPressure.destroy({ where: { user_id }});
      models.Energy.destroy({ where: { user_id }});
      models.Exercise.destroy({ where: { user_id }});
      models.HeartRate.destroy({ where: { user_id }});
      models.Sleep.destroy({ where: { user_id }});
      models.Stand.destroy({ where: { user_id }});
      models.Steps.destroy({ where: { user_id }});
      models.Weight.destroy({ where: { user_id }});
      models.HeartRateFile.destroy({ where: { user_id }});
      models.EKG.destroy({ where: { user_id }});
      models.User.destroy({ where: { id: user_id } });


      // unsubscribe plans
      if (user.stripe_customer_id) {
        await stripe.cancelSubscription(user.stripe_customer_id)
      }

      // delete chats
      let chats = db.collection('rooms').where(user.type === 0 ? 'user_id' : 'doctor_id' , '==', parseInt(id, 10));
      chats.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          doc.ref.delete();
        });
      });
    }
    res.status(200).send({
      data: { msg: 'success'}
    });
  } catch(err) {
    logger.error('Error on blocking user:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/reset_password', async (req, res) => {
  const { user_id, password } = req.body

  const schema = Joi.object().keys({
    user_id: Joi.number().required(),
    password: Joi.string().min(3).max(30).required(),
  });

  try {
    Joi.assert({ user_id, password }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    await models.User.update({ password }, { where: { id: user_id } });

    res.status(200).send({
      data: {
        message: 'Password is changed successfully'
      }
    });
  } catch (err) {
    logger.error('Error on reset password:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/payment', async (req, res) => {
  const { customer_id } = req.query

  try {
    const result = await stripe.getTransactionHistory(customer_id);
    res.status(200).send({
      data: result
    });
  } catch (err) {
    logger.error('Error on fetching payment info:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

export default router;