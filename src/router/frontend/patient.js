import { Router } from 'express';
import Sequelize from 'sequelize';
import Joi from '@hapi/joi';
import models from '../../model';
import config from '../../config';
import logger from '../../middleware/logger';

const Op = Sequelize.Op;

const router = Router();

router.get('/', async (req, res) => {
  const patients = await models.User.findAll({
    nest: true,
    raw: true,
    attributes: [ 'id', 'username', 'first_name', 'last_name', 'photo' ],
    where: { 
      type: 0, 
      status: { [Op.lt]: 2 }
    }
  });
  res.status(200).send({
    data: patients
  });
});

router.post('/', async (req, res) => {
  const { email, password, first_name, last_name, phonenumber } = req.body
  
  const schema = Joi.object().keys({
    username: Joi.string().regex(/^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/).required(),
    email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
    password: Joi.string().min(3).max(30).required(),
    first_name: Joi.string().max(15).required(),
    last_name: Joi.string().max(15).required(),
    phonenumber: Joi.string().max(15).required(),
  });

  try {
    Joi.assert({ username, email, password, first_name, last_name, phonenumber }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const duplication = await models.User.findOne({ where: { email } });
    if (duplication) {
      return res.status(403).send({
        errors: [{ message: `Email already exists` }]
      });
    }

    const result = await models.User.create({
      username,
      email,
      password,
      first_name,
      last_name,
      phonenumber,
      type: 0,
      photo: config.default_avatar,
      status: 1,
    })
    const user = result.get({ plain: true });

    const { id, photo, type, status } = user;

    res.status(200).send({
      data: { user: { id, username, email, first_name, last_name, photo, type, status } }
    });
  } catch (err) {
    logger.error('Error on adding patient:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;