import { Router } from 'express';
import { Sequelize } from 'sequelize';
import Joi from '@hapi/joi';
import models from '../../model';
import config from '../../config';
import logger from '../../middleware/logger';

const Op = Sequelize.Op;

const router = Router();

router.post('/:doctor_id', async (req, res) => {
  const { doctor_id } = req.params;
  const { chat_id, rating, description } = req.body
  const { id, username, first_name, last_name, photo } = req.user;
  
  const schema = Joi.object().keys({
    chat_id: Joi.string().required(),
    rating: Joi.number().integer().min(0).max(5).required(),
  });

  try {
    Joi.assert({ chat_id, rating }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const duplication = await models.Feedback.findOne({ where: { chat_id } });
    if (duplication) {
      return res.status(403).send({
        errors: [{ message: `Already left feedback on this room` }]
      });
    }

    const result = await models.Feedback.create({
      doctor_id,
      chat_id,
      patient_id: id,
      rating,
      description
    })

    res.status(200).send({
      data: { feedback: result, patient: { id, username, first_name, last_name, photo } }
    });
  } catch (err) {
    logger.error('Error on leaving feedback:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;