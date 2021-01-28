import { Router } from 'express';
import { Sequelize } from 'sequelize';
import Joi from '@hapi/joi';
import models from '../../model';
import config from '../../config';
import logger from '../../middleware/logger';

const Op = Sequelize.Op;

const router = Router();

router.get('/', async (req, res) => {
  const doctors = await models.User.findAll({
    nest: true,
    raw: false,
    attributes: [ 'id', 'username', 'first_name', 'last_name', 'subject', 'photo', 'about', 'address', 'phonenumber' ],
    include: [
      { 
        model: models.Feedback, 
        attributes: ['id', 'doctor_id', 'patient_id', 'chat_id', 'rating', 'description', 'createdAt'],
        as: 'feedbacks',
        include: [
          { 
            model: models.User,
            attributes: ['id', 'username', 'first_name', 'last_name', 'photo'],
            as: 'patient' 
          }
        ],
      }
    ],
    where: {
      type: 1, 
      status: 1
    },
  });
  res.status(200).send({
    data: doctors
  });
});

router.get('/:doctor_id', async (req, res) => {
  const { doctor_id } = req.params;
  const doctor = await models.User.findOne({
    nest: true,
    raw: false,
    attributes: [ 'id', 'username', 'first_name', 'last_name', 'subject', 'photo', 'about', 'address', 'phonenumber' ],
    include: [
      {
        model: models.Feedback, 
        as: 'feedbacks',
        include: [
          { 
            model: models.User,
            attributes: ['id', 'username', 'first_name', 'last_name', 'photo'],
            as: 'patient' 
          }
        ],
      }
    ],
    where: {
      type: 1, 
      status: 1,
      id: doctor_id
    },
  });
  res.status(200).send({
    data: doctor
  });
});

router.post('/', async (req, res) => {
  const { username, email, password, first_name, last_name, subject, phonenumber } = req.body
  
  const schema = Joi.object().keys({
    email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
    password: Joi.string().min(3).max(30).required(),
    username: Joi.string().regex(/^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/).required(),
    first_name: Joi.string().max(15).required(),
    last_name: Joi.string().max(15).required(),
    phonenumber: Joi.string().max(15).required(),
    subject: Joi.string().required()
  });

  try {
    Joi.assert({ username, email, password, first_name, last_name, subject, phonenumber }, schema, { abortEarly: false });
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
      subject,
      photo: config.default_avatar,
      type: 1,
      status: 1,
    })
    const user = result.get({ plain: true });

    const { id, photo, type, status } = user;

    res.status(200).send({
      data: { user: { id, username, email, first_name, last_name, photo, type, subject, status } }
    });
  } catch (err) {
    logger.error('Error on adding doctor:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;