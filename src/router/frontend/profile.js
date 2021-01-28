import { Router } from 'express';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';

const router = Router();

router.post('/', async (req, res) => {
  const { photo, username, first_name, last_name, email, phonenumber, address, subject, about } = req.body
  const { id } = req.user;
  
  const schema = Joi.object().keys({
    photo: Joi.string().uri({allowRelative: true}).allow('', null),
    username: Joi.string().regex(/^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/).required(),
    first_name: Joi.string().max(15).required(),
    last_name: Joi.string().max(15).required(),
    email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
    phonenumber: Joi.string().max(20).allow('', null),
    address: Joi.string().allow('', null),
    subject: Joi.string().allow('', null),
    about: Joi.string().allow('', null),
  });

  try {
    Joi.assert({ photo, username, first_name, last_name, email, phonenumber, address, subject, about }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const user = await models.User.findOne({ where: { id } })
    if (!user) {
      return res.status(403).send({
        errors: [{ message: `User isn\'t exist with id: ${id}` }]
      });
    }

    // duplication check of username
    if (username != user.username) {
      const duplication = await models.User.findOne({ where: { username } })
      if (duplication) {
        return res.status(403).send({
          errors: [{ message: `Username is already used by another user, please input another one.` }]
        });
      }
    }

    // duplication check of email
    if (email != user.email) {
      const duplication = await models.User.findOne({ where: { email } })
      if (duplication) {
        return res.status(403).send({
          errors: [{ message: `Email is already used by another user, please input another one.` }]
        });
      }
    }
    
    await models.User.update({ 
      photo,
      username,
      first_name,
      last_name,
      phonenumber: phonenumber || '',
      email,
      address: address || '',
      subject: subject || '',
      about: about || '',
    }, { where: { id } });
    res.status(200).send({
      data: { msg: 'Success' }
    });
  } catch (err) {
    logger.error('Error on updating user:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

export default router;