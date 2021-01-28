import { Router } from 'express';
import Sequelize from 'sequelize';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import Joi from '@hapi/joi';

import config from '../../config';
import models from '../../model';
import logger from '../../middleware/logger';

const Op = Sequelize.Op;

const createToken = async (user, expiresIn) => {
  const { id, email, first_name, last_name, status } = user;
  return await jwt.sign({ id, email, first_name, last_name, status }, config.secret_key, { expiresIn });
};


const router = Router();

router.get('/me', passport.authenticate('jwt-admin', { failWithError: true, session: false }), async (req, res) => {
  const { id, email, first_name, last_name, photo, level, status } = req.user;
  
  res.status(200).send({
    data: { id, email, first_name, last_name, photo, level, status }
  });
});

router.post('/login', passport.authenticate('admin', { failWithError: true }), async (req, res) => {
  try {
    if (req.user.status >= 2) {
      return res.status(401).send({
        errors: [{ message: 'This account is blocked.' }]
      });
    } else if (req.user.status < 1) {
      const { id, email, first_name, last_name, photo, level, status } = req.user;
      return res.status(401).send({
        data: { user: { id, email, first_name, last_name, photo, level, status } },
        errors: [{ message: 'This account isn\'t active. Please contact to admin.' }]
      });
    }

    const token = await createToken(req.user, config.token_expiresin)
    const refresh_token = await createToken(req.user, config.refresh_token_expiresin)

    const { id, email, first_name, last_name, photo, level, status } = req.user;

    await models.AdminLogin.create({
      admin_id: id,
      refresh_token,
      login_type: 0
    })

    res.status(200).send({
      data: { user: { id, email, first_name, last_name, photo, level, status }, token, refresh_token }
    });
  } catch (err) {
    logger.error('Error on login:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/logout', passport.authenticate('jwt-admin', { failWithError: true, session: false }), async (req, res) => {
  const { refresh_token } = req.body;

  const schema = Joi.object().keys({
    refresh_token: Joi.string().required(),
  });

  try {
    Joi.assert({ refresh_token }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const { id } = req.user;
    const userLogin = await models.AdminLogin.findOne({ where: { admin_id: id, refresh_token } })

    if (!userLogin) {
      return res.status(403).send({
        errors: [{ message: `No account found with this refresh token: ${refresh_token}` }]
      });
    }

    await userLogin.update({ status: 3 });

    req.logout();
    res.status(200).send({ data: 'Success' });
  } catch (err) {
    logger.error('Error on logout:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/token', async (req, res) => {
  const { refresh_token } = req.body;

  const schema = Joi.object().keys({
    refresh_token: Joi.string().required(),
  });

  try {
    Joi.assert({ refresh_token }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const decoded = jwt.verify(refresh_token, config.secret_key, { ignoreExpiration: true });
    const user = await models.Admin.findByPk(decoded.id);

    const userLogin = await models.AdminLogin.findOne({ where: { admin_id: user.id, refresh_token } });
    if (!userLogin) {
      return res.status(403).send({
        errors: [{ message: `No account found with this refresh token: ${refresh_token}` }]
      });
    } else if (userLogin.status > 1) {
      return res.status(403).send({
        errors: [{ message: `refresh token invalid` }]
      });
    }

    if (decoded.exp <= Math.floor(Date.now() / 1000)) {
      await userLogin.update({ logout: new Date().toLocaleString(), status: 2 });
      return res.status(401).send({
        errors: [{message: 'refresh token expired'}]
      });
    }

    const token = await createToken(user, config.token_expiresin)
    const new_refresh_token = await createToken(user, config.refresh_token_expiresin)
    
    await userLogin.update({ refresh_token: new_refresh_token, refresh: new Date().toLocaleString(), status: 1 });

    const { id, email, first_name, last_name, photo, level, status } = user;

    res.status(200).send({
      data: { user: { id, email, first_name, last_name, photo, level, status }, token, refresh_token: new_refresh_token }
    });
  } catch (err) {
    logger.error('Error on update token:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;