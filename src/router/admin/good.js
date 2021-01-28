import { Router } from 'express';
import { Sequelize } from 'sequelize';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';

const Op = Sequelize.Op;

const router = Router();

const GoodAttributes = [ 'id', 'name', 'description', 'image', 'price', 'link', 'createdAt', 'updatedAt' ];
const GoodIncludes = [
  {
    model: models.Reaction,
    attributes: ['user_id'],
    required: false,
    where: {
      type: 2,
      value: 1
    },
    as: 'likes'
  },
  {
    model: models.Reaction,
    attributes: ['user_id'],
    required: false,
    where: {
      type: 2,
      value: 2
    },
    as: 'dislikes'
  }
];

router.get('/', async (req, res) => {
  const goods = await models.Good.findAll({
    nest: true,
    raw: false,
    attributes: GoodAttributes,
    include: GoodIncludes,
    order: [ ['id', 'DESC'], ],
  });
  res.status(200).send({
    data: goods
  });
});

router.get('/mine', async (req, res) => {
  const { id } = req.user;
  const goods = await models.Good.findAll({
    nest: true,
    raw: false,
    attributes: GoodAttributes,
    include: GoodIncludes,
    where: {
      admin_id: id
    },
    order: [ ['id', 'DESC'], ],
  });
  res.status(200).send({
    data: goods
  });
});

router.get('/:good_id', async (req, res) => {
  const { good_id } = req.params;
  const good = await models.Good.findOne({
    nest: true,
    raw: false,
    attributes: GoodAttributes,
    include: GoodIncludes,
    where: {
      id: good_id
    },
  });
  res.status(200).send({
    data: good
  });
});

router.post('/:good_id', async (req, res) => {
  const { good_id } = req.params;
  const { name, description, image, price, link } = req.body
  const { id } = req.user;
  
  const schema = Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required(),
    image: Joi.string().required(),
    link: Joi.string().required(),
    price: Joi.number().min(0.01).required(),
  });

  try {
    Joi.assert({ name, description, image, price, link }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let good = {};
    if (parseInt(good_id, 10) === 0) {
      const result = await models.Good.create({
        admin_id: id,
        name, description, image, price, link
      })
      good = result.get({ plain: true });
    } else {
      await models.Good.update({ name, description, image, price, link }, { where: { id: good_id } });
      good = await models.Good.findByPk(good_id);
    }
    let { createdAt, updatedAt } = good;
    res.status(200).send({
      data: { good: { id: good.id, name, description, image, price, link, createdAt, updatedAt } }
    });
  } catch (err) {
    logger.error('Error on creating good:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/delete/:good_id', async (req, res) => {
  const { good_id } = req.params;

  try {
    await models.Good.destroy({ where: { id: good_id } });
    await models.Reaction.destroy({ where: { relation_id: good_id, type: 2 }});
    res.status(200).send({
      data: { msg: 'success' }
    });
  } catch (err) {
    logger.error('Error on deleting good:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;