import { Router } from 'express';
import Sequelize from 'sequelize';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import Joi from '@hapi/joi';

import config from '../../config';
import models from '../../model';
import * as utils from '../../utils';
import mailer from '../../middleware/mailer';
import logger from '../../middleware/logger';


const Op = Sequelize.Op;

const createToken = async (user, expiresIn = 0) => {
  const { id, photo, username, email, first_name, last_name, type, status, subject, address, about, phonenumber } = user;
  return await jwt.sign({ id, photo, username, email, first_name, last_name, type, status, subject, address, about, phonenumber }, config.secret_key, expiresIn !== 0 ? { expiresIn } : {});
};

const sendActivationMail = async (user) => {
  const {
    id,
    first_name,
    last_name,
    email,
  } = user;

  const activation = {};
  activation.user_id = id;
  activation.code = utils.generateCode(config.activation_code_digit);
  activation.hash = await jwt.sign({
    activation_code: activation.code,
    email,
    time: new Date().getTime()
  }, config.secret_key, { expiresIn: config.activation_code_expiresin });
  activation.link = `${config.web_root_url}${config.activation_link_url}?hval=${activation.hash}&code=${activation.code}`;

  try{
    await models.Activation.create(activation);
    
    await mailer.sendConfirmationEmail({
      first_name,
      last_name,
      email,
      activation_code: activation.code,
      activation_link: activation.link
    });
  } catch (err) {
    logger.error('Error on sending activation code:', err);
    throw err;
  }
}

const sendResetPasswordMail = async (user) => {
  const {
    id,
    first_name,
    last_name,
    email,
  } = user;

  const activation = {};
  activation.user_id = id;
  activation.code = utils.generateCode(config.activation_code_digit);
  activation.hash = await jwt.sign({
      activation_code: activation.code,
      email,
      time: new Date().getTime()
    }, config.secret_key, { expiresIn: config.activation_code_expiresin });
  activation.link = `${config.web_root_url}${config.reset_password_link_url}?hval=${activation.hash}&code=${activation.code}`;

  try{
    await models.Activation.create(activation);
    
    await mailer.sendResetPasswordMail({
      first_name,
      last_name,
      email,
      activation_code: activation.code,
      activation_link: activation.link
    });
  } catch (err) {
    logger.error('Error on sending activation code:', err);
    throw err;
  }
}

const checkActivationCode = async (activation) => {
  const sendDate = new Date(activation.createdAt),
  diff = (new Date()).getTime() - sendDate.getTime();

  if (activation.status == 0 && diff / 1000 < config.activation_code_expiresin) {
    return true
  } else {
    await models.Activation.update({ status: 2 }, { where: { id: activation.id } })
    return false
  }
}

const activeUser = async (user, activation) => {
  let transaction;

  try {
    transaction = await models.transaction();

    await models.User.update({ status: 1}, { where: { id: user.id }, transaction });
    await models.Activation.update({ status: 1 }, { where: { id: activation.id }, transaction });

    await transaction.commit();
  } catch (err) {
    logger.error('Error on active user:', err);
    if (transaction) await transaction.rollback();
    throw err;
  }
}

const router = Router();

router.get('/me', passport.authenticate('jwt', { failWithError: true, session: false }), async (req, res) => {
  const { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber } = req.user;
  
  res.status(200).send({
    data: { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber }
  });
});

router.post('/login', passport.authenticate('local', { failWithError: true }), async (req, res) => {
  try {
    if (req.user.status >= 2) {
      return res.status(401).send({
        errors: [{ message: 'This account is blocked, please contact to support.' }]
      });
    } else if (req.user.status < 1) {
      const { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber } = req.user;
      return res.status(401).send({
        data: { user: { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber } },
        errors: [{ message: "Account isn't active, check verification email in your mailbox, or email to support@clubafib.com for help." }]
      });
    }
    
    const { login_type } = req.body;
    const { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber } = req.user;

    const token = await createToken(req.user)
    const refresh_token = await createToken(req.user)

    await models.UserLogin.create({
      user_id: id,
      refresh_token,
      login_type
    })

    res.status(200).send({
      data: { user: { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber }, token, refresh_token }
    });
  } catch (err) {
    logger.error('Error on login:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/logout', passport.authenticate('jwt', { failWithError: true, session: false }), async (req, res) => {
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
    const userLogin = await models.UserLogin.findOne({ where: { user_id: id, refresh_token } })

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
    const user = await models.User.findByPk(decoded.id);

    const userLogin = await models.UserLogin.findOne({ where: { user_id: user.id, refresh_token } });
    if (!userLogin) {
      return res.status(403).send({
        errors: [{ message: `No account found with this refresh token: ${refresh_token}` }]
      });
    } else if (userLogin.status > 1) {
      return res.status(403).send({
        errors: [{ message: `refresh token invalid` }]
      });
    }

    // if (decoded.exp <= Math.floor(Date.now() / 1000)) {
    //   await userLogin.update({ logout: new Date().toLocaleString(), status: 2 });
    //   return res.status(401).send({
    //     errors: [{message: 'refresh token expired'}]
    //   });
    // }

    const token = await createToken(user)
    const new_refresh_token = await createToken(user)
    
    await userLogin.update({ refresh_token: new_refresh_token, refresh: new Date().toLocaleString(), status: 1 });

    const { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber } = user;

    res.status(200).send({
      data: { user: { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber }, token, refresh_token: new_refresh_token }
    });
  } catch (err) {
    logger.error('Error on update token:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/signup', async (req, res) => {
  const { email, username, password, first_name, last_name, phonenumber, type, subject, login_type } = req.body
  
  let keys = {
    email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
    username: Joi.string().regex(/^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/).required(),
    password: Joi.string().min(3).max(30).required(),
    first_name: Joi.string().max(15).required(),
    last_name: Joi.string().max(15).required(),
    phonenumber: Joi.string().max(15).required(),
    type: Joi.number().min(0).max(1).required(),
    login_type: Joi.number().required(),
  };
  let fields = { email, username, password, first_name, last_name, phonenumber, type, login_type };
  if (type === 1) {
    keys["subject"] = Joi.string().required();
    fields["subject"] = subject;
  }

  const schema = Joi.object().keys(keys);

  try {
    Joi.assert(fields, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const duplication = await models.User.findOne({where: { [Op.or]: [{ email } , { username }] }});
    if (duplication) {
      return res.status(403).send({
        errors: [{ message: `${duplication.username === username? 'Username' : 'Email'} already exists. If you are having trouble creating an account, send an email to support@clubafib.com` }]
      });
    }

    const result = await models.User.create({
      email,
      username,
      password,
      first_name,
      last_name,
      phonenumber,
      type,
      subject,
      photo: config.default_avatar,
      status: 0,
    })
    const user = result.get({ plain: true });

    const token = await createToken(user)
    const refresh_token = await createToken(user)

    const { id, photo, status, address, about } = user

    await models.UserLogin.create({
      user_id: id,
      refresh_token,
      login_type
    })
    
    await sendActivationMail(user);
    await mailer.sendJoinEmail({user, method: ''})

    res.status(200).send({
      data: { user: { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber }, token, refresh_token }
    });
  } catch (err) {
    logger.error('Error on signup:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/activate', async (req, res) => {
  const { email, code, login_type } = req.body

  const schema = Joi.object().keys({
    email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
    code: Joi.string().min(6).max(10).required(),
  });

  try {
    Joi.assert({ email, code }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const user = await models.User.findOne({ where: { email } });
    if (!user) {
      return res.status(403).send({
        errors: [{ message: `Your email isn't registered` }]
      });
    }
    
    if (user.status == 1) {
      return res.status(403).send({
        errors: [{ message: `Your account is already activated. Please try to login.` }]
      });
    } else if (user.status != 0) {
      return res.status(403).send({
        errors: [{ message: `Unable to active this account. Please contact to support.` }]
      });
    }

    const activation = await models.Activation.findOne({
      where: { user_id: user.id, code },
      order: [ ['create_date', 'DESC'], ],
    });
    if (!activation) {
      return res.status(403).send({
        errors: [{ message: `Activation code is incorrect` }]
      });
    }
    
    const isCodeValid = await checkActivationCode(activation)
    if (!isCodeValid) {
      return res.status(403).send({
        errors: [{ message: `Activation code is expired` }]
      });
    }
    
    await activeUser(user, activation)

    const token = await createToken(user)
    const refresh_token = await createToken(user)

    const { id, username, first_name, last_name, photo, subject, type, address, about, phonenumber } = user;

    await models.UserLogin.create({
      user_id: id,
      refresh_token,
      login_type
    })

    res.status(200).send({
      data: { user: { id, username, email, first_name, last_name, photo, type, subject, status: 1, address, about, phonenumber }, token, refresh_token }
    });
  } catch (err) {
    logger.error('Error on activate user:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/request_activation', async (req, res) => {
  const { email } = req.body

  const schema = Joi.object().keys({
    email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
  });

  try {
    Joi.assert({ email }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const user = await models.User.findOne({where: { email }});
    if (!user) {
      return res.status(403).send({
        errors: [{ message: `Your email isn't registered` }]
      });
    }
    
    if (user.status != 0) {
      return res.status(403).send({
        errors: [{ message: `Your account is already activated. Please try to login.` }]
      });
    }

    sendActivationMail(user);

    res.status(200).send({
      data: { message: `Activation code is sent to ${email}` }
    });
  } catch (err) {
    logger.error('Error on requesting activation code:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/reset_password', async (req, res) => {
  const { email, code, password } = req.body

  const schema = Joi.object().keys({
    email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
    code: Joi.string().min(6).max(10).required(),
    password: Joi.string().min(3).max(30).required(),
  });

  try {
    Joi.assert({ email, code, password }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const user = await models.User.findOne({ where: { email } });
    if (!user) {
      return res.status(403).send({
        errors: [{ message: `Your email isn't registered` }]
      });
    }
    
    if (user.status == 0) {
      return res.status(403).send({
        errors: [{ message: `Your account isn't activated. Please activate that first` }]
      });
    } else if (user.status != 1) {
      return res.status(403).send({
        errors: [{ message: `Your account has a problem. Please contact to support.` }]
      });
    }

    const activation = await models.Activation.findOne({
      where: { user_id: user.id, code },
      order: [ ['create_date', 'DESC'], ],
    });
    if (!activation) {
      return res.status(403).send({
        errors: [{ message: `Activation code is incorrect` }]
      });
    }
    
    const isCodeValid = await checkActivationCode(activation)

    if (!isCodeValid) {
      return res.status(403).send({
        errors: [{ message: `Activation code is expired` }]
      });
    }

    await models.User.update({ password }, { where: { id: user.id } });

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

router.post('/request_reset_password', async (req, res) => {
  const { email } = req.body

  const schema = Joi.object().keys({
    email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
  });

  try {
    Joi.assert({ email }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const user = await models.User.findOne({where: { email }});
    if (!user) {
      return res.status(403).send({
        errors: [{ message: `Your email isn't registered` }]
      });
    }
    
    if (user.status == 0) {
      return res.status(403).send({
        errors: [{ message: `Your account isn't activated. Please activate that first` }]
      });
    } else if (user.status != 1) {
      return res.status(403).send({
        errors: [{ message: `Your account has a problem. Please contact to support.` }]
      });
    }

    sendResetPasswordMail(user);

    res.status(200).send({
      data: { message: `Reset password email is sent to ${email}` }
    });
  } catch (err) {
    logger.error('Error on requesting reset password:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/facebook', passport.authenticate('facebook-token'), async (req, res) => {
  try {
    if (req.user.status >= 2) {
      return res.status(401).send({
        errors: [{ message: 'This account is blocked, please contact to support.' }]
      });
    }
    
    const { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber } = req.user;
    const { login_type } = req.body;

    const token = await createToken(req.user)
    const refresh_token = await createToken(req.user)

    await models.UserLogin.create({
      user_id: id,
      refresh_token,
      login_type
    })
    if (req.authInfo.newUser) {
      await mailer.sendJoinEmail({user: { id, username, email, first_name, last_name, type }, method: 'facebook'})
    }

    res.status(200).send({
      data: { user: { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber }, token, refresh_token }
    });
  } catch (err) {
    logger.error('Error on facebook login:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/google', passport.authenticate('google-token'), async (req, res) => {
  try {
    if (req.user.status >= 2) {
      return res.status(401).send({
        errors: [{ message: 'This account is blocked, please contact to support.' }]
      });
    }
    
    const { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber } = req.user;
    const { login_type } = req.body;

    const token = await createToken(req.user)
    const refresh_token = await createToken(req.user)

    await models.UserLogin.create({
      user_id: id,
      refresh_token,
      login_type
    })

    if (req.authInfo.newUser) {
      await mailer.sendJoinEmail({user: { id, username, email, first_name, last_name, type }, method: 'google'})
    }

    res.status(200).send({
      data: { user: { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber }, token, refresh_token }
    });
  } catch (err) {
    logger.error('Error on google login:', err);
    res.status(500).send({
      errors: [err]
    });
  }
}
);

router.post('/apple', async (req, res) => {
  let { apple_id, first_name } = req.body

  const schema = Joi.object().keys({
    apple_id: Joi.string().required(),
  });

  try {
    Joi.assert({ apple_id, }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const appleRes = await models.User.findByApple(req.body);
    const { user, newUser } = appleRes;
    let { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber } = user;

    const token = await createToken(user)
    const refresh_token = await createToken(user)

    await models.UserLogin.create({
      user_id: id,
      refresh_token,
      login_type: 1
    })

    if (newUser) {
      await mailer.sendJoinEmail({user: { id, username, email, first_name, last_name, type }, method: 'apple'})
    }

    res.status(200).send({
      data: { user: { id, username, email, first_name, last_name, photo, type, subject, status, address, about, phonenumber }, token, refresh_token }
    });
  } catch (err) {
    logger.error('Error on apple login:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

export default router;