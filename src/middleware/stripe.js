import Stripe from 'stripe';

import config from '../config';
import logger from './logger/stripe';


class StripeEngine {
  constructor() {
    this.stripe = new Stripe(config.stripe_api_key);
  }

  // PaymentIntent
  async createPaymentIntent(amount, currency, customer_id) {
    const paymentIntent  = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer: customer_id,
    });
    return paymentIntent ;
  }

  // PaymentMethod
  async getPaymentMethod(payment_id) {
    let paymentMethod;
    try {
      paymentMethod = await this.stripe.paymentMethods.retrieve(payment_id)
    } catch (err) {
      logger.error(`error on getting stripe payment method:`, err)
    }
    return paymentMethod;
  }

  async attachPaymentMethod(payment_id, customer_id) {
    let paymentMethod;
    try {
      paymentMethod = await this.stripe.paymentMethods.attach(payment_id, {customer: customer_id})
    } catch (err) {
      logger.error(`error on attach stripe payment method to customer:`, err)
    }
    return paymentMethod;
  }

  // Token
  async getToken(token_id) {
    let token;
    try {
      token = await this.stripe.tokens.retrieve(token_id)
    } catch (err) {
      logger.error(`error on getting stripe token:`, err)
    }
    return token;
  }

  // Ephemeralkeys
  async getEphemeralKeys(customer_id, api_version) {
    return await this.stripe.ephemeralKeys.create(
      { customer: customer_id },
      { apiVersion: api_version },
    );
  }

  // Customer
  async createCustomer(name, email) {
    let customer;
    try {
      customer = await this.stripe.customers.create({
        name,
        email,
      });
    } catch (err) {
      logger.error(`error on creating stripe customer:`, err)
    }
    return customer;
  }

  async createCustomerWithPaymentMethod(payment_id, name, email) {
    let customer;
    try {
      customer = await this.stripe.customers.create({
        payment_method: payment_id,
        name,
        email,
        invoice_settings: {
          default_payment_method: payment_id,
        },
      });
    } catch (err) {
      logger.error(`error on creating stripe customer:`, err)
    }
    return customer;
  }

  async createCustomerWithToken(token_id, name, email) {
    let customer;
    try {
      customer = await this.stripe.customers.create({
        name,
        email,
        source: token_id,
      });
    } catch (err) {
      logger.error(`error on creating stripe customer:`, err)
    }
    return customer;
  }

  async getCustomer(customer_id) {
    let customer;
    try {
      customer = await this.stripe.customers.retrieve(customer_id)
    } catch (err) {
      logger.error(`error on getting stripe customer:`, err)
    }
    return customer;
  }

  async getCustomerDefaultSource(customer) {
    let source;
    try {
      if (customer && customer.default_source) {
        source = await this.stripe.customers.retrieveSource(customer.id, customer.default_source)
      }
    } catch (err) {
      logger.error(`error on getting stripe customer default source:`, err)
    }
    return source;
  }

  async updateCustomer(customer_id, params) {
    let customer = false;
    try {
      customer = await this.stripe.customers.update(customer_id, params)
    } catch (err) {
      logger.error(`error on updating stripe customer:`, err)
    }
    return customer;
  }

  // Subscription
  async createSubscription(customer_id, subscription_type) {
    let subscription;
    try {
      const interval = subscription_type == 2 ? "year" : "month";
      const plan = await this.getPlan(interval);
      if (!plan) {
        return null;
      }
      subscription = await this.stripe.subscriptions.create({
        customer: customer_id,
        items: [{
          plan: plan.id,
        }],
        trial_from_plan: true,
        expand: ["latest_invoice.payment_intent"],
      });
    } catch (err) {
      logger.error(`error on creating stripe subscription:`, err)
    }
    return subscription;
  }

  async getSubscription(subscription_id) {
    let subscription;
    try {
      subscription = await this.stripe.subscriptions.retrieve(subscription_id)
    } catch (err) {
      logger.error(`error on getting stripe subscription:`, err)
    }
    return subscription;
  }

  async updateSubscription(subscription_id, params) {
    let subscription = false;
    try {
      subscription = await this.stripe.subscriptions.update(subscription_id, params)
    } catch (err) {
      logger.error(`error on updating stripe subscription:`, err)
    }
    return subscription;
  }

  async cancelSubscription(subscription_id) {
    let subscription;
    try {
      subscription = await this.stripe.subscriptions.del(subscription_id)
    } catch (err) {
      logger.error(`error on cancel stripe subscription:`, err)
    }
    return subscription;
  }

  // Plan
  async getPlan(interval = "month") {
    let plan;
    try {
      const plans = await this.stripe.plans.list({ active: true });
      if (!plans || !plans.data || plans.data.length === 0) {
        logger.error(`error on stripe plans response:`, plans)
        return null;
      }
      for (let item of plans.data) {
        if (item.interval == interval) {
          plan = item;
          break;
        }
      }
    } catch (err) {
      logger.error(`error on getting stripe plan:`, err)
    }
    return plan;
  }

  // Transaction List
  async getTransactionHistory(customer_id) {
    let list = [];
    try {
      list = await this.stripe.paymentIntents.list({
        customer: customer_id
      });
    } catch (err) {
      logger.error(`error on getting customer transaction:`, err)
    }
    return list;
  }
}

const stripeEngine = new StripeEngine();
export default stripeEngine
