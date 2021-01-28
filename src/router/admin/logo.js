import { Router } from 'express';
import { Sequelize } from 'sequelize';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';

const Op = Sequelize.Op;

const router = Router();

router.post('/', async (req, res) => {
  const { logo } = req.body
  
  const schema = Joi.object().keys({
    logo: Joi.string().required(),
  });

  try {
    Joi.assert({ logo }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let checkExist = await models.Logo.findByPk(1);
    if (checkExist) {
      await models.Logo.update({ logo }, { where: { id: checkExist.id }});
    } else {
      await models.Logo.create({ logo });
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