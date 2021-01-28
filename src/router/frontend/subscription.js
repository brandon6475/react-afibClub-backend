import { Router } from 'express';
import { Sequelize } from 'sequelize';
import Joi from '@hapi/joi';
import models from '../../model';
import config from '../../config';
import stripe from '../../middleware/stripe';
import logger from '../../middleware/logger';
import mailer from '../../middleware/mailer';

const Op = Sequelize.Op;

const router = Router();

router.get('/payment', async (req, res) => {
  const { id } = req.user;

  try {
    const payment = await models.Payment.findOne({ where: { user_id: id, status: { [Op.lt]: 2 } } });
    res.status(200).send({
      data: payment
    });
  } catch (err) {
    logger.error('Error on getting active payment:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/ephemeral_keys', async (req, res) => {
  const { id } = req.user;
  const { api_version } = req.body
  
  const schema = Joi.object().keys({
    api_version: Joi.string().required(),
  });

  try {
    Joi.assert({ api_version }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const user = await models.User.findByPk(id);

    let stripeCustomer
    if (user.stripe_customer_id) {
      stripeCustomer = await stripe.getCustomer(user.stripe_customer_id);
    }
    
    if (!stripeCustomer) {
      stripeCustomer = await stripe.createCustomer(`${user.first_name} ${user.last_name}`, user.email);
      models.User.update({ stripe_customer_id: stripeCustomer.id }, { where: { id } });
    }

    const key = await stripe.getEphemeralKeys(stripeCustomer.id, api_version)

    res.status(200).send({
      data: key
    });
  } catch (err) {
    logger.error('Error on getting stripe ephemeralkey:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/payment_intent', async (req, res) => {
  const { id } = req.user;
  const { type } = req.body
  
  const schema = Joi.object().keys({
    type: Joi.number().required(),
  });

  try {
    Joi.assert({ type }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const user = await models.User.findByPk(id);

    let stripeCustomer
    if (user.stripe_customer_id) {
      stripeCustomer = await stripe.getCustomer(user.stripe_customer_id);
    }
    
    if (!stripeCustomer) {
      stripeCustomer = await stripe.createCustomer(`${user.first_name} ${user.last_name}`, user.email);
      models.User.update({ stripe_customer_id: stripeCustomer.id }, { where: { id } });
    }

    const price = type == 0? 9900 : 4900
    const paymentIntent = await stripe.createPaymentIntent(price, 'usd', stripeCustomer.id);

    res.status(200).send({
      data: paymentIntent.client_secret
    });
  } catch (err) {
    logger.error('Error on getting stripe payment intent:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/onetime-pay', async (req, res) => {
  const { id } = req.user;
  const { stripe_id } = req.body;

  const schema = Joi.object().keys({
    stripe_id: Joi.string().required(),
  });

  try {
    Joi.assert({ stripe_id }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }
  
  try {
    let payment = await models.Payment.findOne({  where: { user_id: id, type: 0 } });
    if (payment) {
      payment.update({ status: 0, stripe_id })
    } else {
      payment = await models.Payment.create({ user_id: id, stripe_id, type: 0, status: 0 });
    }

    mailer.sendPaymentEmail({ user: req.user, type: 0 })
    mailer.sendSubscribeEmail({ user: req.user })
    
    res.status(200).send({
      data: {
        payment,
      }
    });
  } catch (err) {
    logger.error('Error on creating onetime pay:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/subscribe', async (req, res) => {
  const { id } = req.user;
  const { payment_id, type } = req.body;
  // const { token_id } = req.body;

  const schema = Joi.object().keys({
    payment_id: Joi.string().required(),
    type: Joi.number().allow(null),
    // token_id: Joi.string().required(),
  });

  try {
    Joi.assert({ payment_id, type }, schema, { abortEarly: false });
    // Joi.assert({ token_id }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }
  
  try {
    const user = await models.User.findByPk(id);
    const subscription_type = parseInt(type || 1);

    const paymentMethod = await stripe.getPaymentMethod(payment_id);
    if (!paymentMethod) {
    // const token = await stripe.getToken(token_id);
    // if (!token) {
      return res.status(500).send({
        errors: [{ message: `Payment method is not valid.` }]
      });
    }

    let stripeCustomer
    if (user.stripe_customer_id) {
      await stripe.attachPaymentMethod(payment_id, user.stripe_customer_id);
      stripeCustomer = await stripe.updateCustomer(
        user.stripe_customer_id,
        { invoice_settings: { default_payment_method: payment_id } },
        // { source: token_id },
      );
    }
    
    if (!stripeCustomer) {
      stripeCustomer = await stripe.createCustomerWithPaymentMethod(payment_id, `${user.first_name} ${user.last_name}`, user.email);
      models.User.update({ stripe_customer_id: stripeCustomer.id }, { where: { id } });
    }
    if (!stripeCustomer) {
      return res.status(500).send({
        errors: [{ message: `There is a problem on your payment method.` }]
      });
    }

    const stripeSubscription = await stripe.createSubscription(stripeCustomer.id, subscription_type);
    if (!stripeSubscription) {
      return res.status(500).send({
        errors: [{ message: `There is a problem on your payment method.` }]
      });
    }
    const status = stripeSubscription.status === 'trialing' || stripeSubscription.status === 'active'? 0 : 2;
    const payment = await models.Payment.create({ user_id: id, stripe_id: stripeSubscription.id, type: subscription_type, status });

    mailer.sendPaymentEmail({ user: req.user, type: type || 1 })
    mailer.sendSubscribeEmail({ user: req.user })
    
    res.status(200).send({
      data: {
        payment,
        customer: stripeCustomer,
        subscription: stripeSubscription,
      }
    });
  } catch (err) {
    logger.error('Error on subscribe:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/cancel_subscription', async (req, res) => {
  const { id } = req.user;
  const { subscription_id } = req.body;

  const schema = Joi.object().keys({
    subscription_id: Joi.string().required(),
  });

  try {
    Joi.assert({ subscription_id }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }
  
  try {
    const user = await models.User.findByPk(id);

    let payment = await models.Payment.findOne({ where: { user_id: id, stripe_id: subscription_id, type: { [Op.gt]: 0 } } });
    if (!payment) {
      return res.status(403).send({
        errors: [{ message: `Subscription isn\'t available` }]
      });
    }
    payment = payment.get({ plain: true });
    
    let subscription = await stripe.getSubscription(subscription_id);
    if (subscription && subscription.status !== 'canceled') {
      subscription = await stripe.cancelSubscription(subscription_id)
    }

    await models.Payment.update({ status: 2 }, { where: { id: payment.id } });
    
    res.status(200).send({
      data: { payment: { ...payment, status: 2 }, subscription }
    });
  } catch (err) {
    logger.error('Error on cancel subscription:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;