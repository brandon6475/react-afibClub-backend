import { Router } from 'express';
import { Sequelize } from 'sequelize';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';

const Op = Sequelize.Op;

const router = Router();

router.post('/', async (req, res) => {
  const { id } = req.query;
  const { title, color } = req.body
  
  const schema = Joi.object().keys({
    title: Joi.string().required(),
    color: Joi.string().required(),
  });

  try {
    Joi.assert({ title, color }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    if (parseInt(id, 10) === 0) {
      let checkExist = await models.Category.findOne({ where: { title }});
      if (checkExist) {
        return res.status(403).send({
          errors: [{ message: `Same category already exists` }]
        });
      } else {
        await models.Category.create({ title, color })
      }
    } else {
      await models.Category.update({ title, color }, { where: { id }});
    }
    
    res.status(200).send({
      data: { msg: 'success' }
    });
  } catch (err) {
    logger.error('Error on updating logo:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

export default router;