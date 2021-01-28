import { Router } from 'express';

import models from '../model';
import stripe from '../middleware/stripe';
import logger from '../middleware/logger/stripe';


const OnSubscriptionUpdated = async (subscription, previous_attributes) => {
  if ('status' in previous_attributes) {
    if (subscription.status === 'unpaid' || subscription.status === 'canceled') {
      const payment = await models.Payment.findOne({ where: { stripe_id: subscription.id } });
      if (payment) {
        logger.info(`User subscription disabled : ${payment}`);
        await models.Payment.update({ status: 2 }, { where: { id: payment.id } });
      }
    } else if (subscription.status === 'active') {
      const payment = await models.Payment.findOne({ where: { stripe_id: subscription.id } });
      if (payment) {
        logger.info(`User subscription enabled : ${payment}`);
        await models.Payment.update({ status: 0 }, { where: { id: payment.id } });
      }
    }
  }
}

const OnSubscriptionDeleted = async (subscription) => {
  if (subscription.status === 'canceled') {
    const payment = await models.Payment.findOne({ where: { stripe_id: subscription.id } });
    if (payment) {
      logger.info(`User subscription disabled : ${payment}`);
      await models.Payment.update({ status: 2 }, { where: { id: payment.id } });
    }
  }
}

const OnPaymentSucceed = async (paymentIntent) => {
  if (paymentIntent.status === 'succeeded') {
    logger.info(`Payment received: ${paymentIntent}`);
    const user = await models.User.findOne({ where: { stripe_customer_id: paymentIntent.customer } });
    if (!user) {
      return logger.info(`Can't find user with stripe customer id : ${paymentIntent.customer}`);
    }
    await models.Payment.create({ user_id: user.id, stripe_id: paymentIntent.id, type: 0 });
  }
}


const router = Router();

router.post('/webhooks', async function (req, res) {
  const { data, type } = req.body;
  const { object, previous_attributes } = data;
  
  logger.info(`/webhooks POST route hit! : '${type}' `);
  logger.info(`data : '${JSON.stringify(data)}' `);

  switch (type) {
    case 'customer.subscription.updated':
      OnSubscriptionUpdated(object, previous_attributes)
      break;
    case 'customer.subscription.deleted':
      OnSubscriptionDeleted(object)
      break;
    case 'payment_intent.succeeded':
      OnPaymentSucceed(object)
      break;
    default:
      break;
  }

  res.json({received: true});
});

export default router;