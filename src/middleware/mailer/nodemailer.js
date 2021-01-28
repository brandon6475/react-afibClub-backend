import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';

import config from '../../config';
import logger from '../logger';

const AdminEmail = 'support@clubafib.com';

class NodemailerSmtpApi {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: config.mail_sender_email,
        pass: config.mail_sender_password,
      },
    });
  }

  async sendConfirmationEmail(data) {
    const { first_name, last_name, email, activation_code, activation_link } = data;
    let htmlToSend = compileTemplate({ first_name: first_name, last_name: last_name, activation_link: activation_link, activation_code: activation_code, company_name: config.company_name }, './templates/confirm-email.html');
    
    let responseFromEmail = await this.transporter.sendMail({
      from: `"${config.mail_sender_name}" ${config.mail_sender_email}`,
      to: email,
      subject: config.confirm_mail_subject,
      html: htmlToSend,
    });
    
    logger.info(`Message sent: ${responseFromEmail.messageId}`);
    logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(responseFromEmail)}`);
    
    return responseFromEmail;
  }

  async sendResetPasswordMail(data) {
    const { first_name, last_name, email, activation_code, activation_link } = data;
    let htmlToSend = compileTemplate({ first_name: first_name, last_name: last_name, activation_link: activation_link, activation_code: activation_code, company_name: config.company_name }, './templates/reset-password-email.html');
    
    let responseFromEmail = await this.transporter.sendMail({
      from: `"${config.mail_sender_name}" ${config.mail_sender_email}`,
      to: email,
      subject: config.reset_password_mail_subject,
      html: htmlToSend,
    });
    
    logger.info(`Message sent: ${responseFromEmail.messageId}`);
    logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(responseFromEmail)}`);
    
    return responseFromEmail;
  }

  async sendJoinEmail(data) {
    let { id, first_name, last_name, email, username, type } = data.user;
    let { method } = data;
    type = parseInt(type, 10) === 0 ? 'patient' : 'doctor';
    let htmlToSend = compileTemplate({ id, username, first_name, last_name, email, type, method: method.length === 0 ? '' : `with ${method}`, company_name: config.company_name }, './templates/new-user-email.html');
    
    let responseFromEmail = await this.transporter.sendMail({
      from: `"${config.mail_sender_name}" ${config.mail_sender_email}`,
      to: AdminEmail,
      subject: 'New User Joined!',
      html: htmlToSend,
    });
    
    logger.info(`Message sent: ${responseFromEmail.messageId}`);
    logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(responseFromEmail)}`);
    
    return responseFromEmail;
  }

  async sendPaymentEmail(data) {
    let { id, first_name, last_name, email, username } = data.user;
    let { type } = data;
    let htmlToSend = compileTemplate({ id, username, first_name, last_name, email, type: type === 0 ? 'One-time Payment' : type === 1 ? 'Monthly Subscribe' : 'Ultimate Subscribe', company_name: config.company_name }, './templates/payment-email.html');
    
    let responseFromEmail = await this.transporter.sendMail({
      from: `"${config.mail_sender_name}" ${config.mail_sender_email}`,
      to: AdminEmail,
      subject: 'A new payment is made!',
      html: htmlToSend,
    });
    
    logger.info(`Message sent: ${responseFromEmail.messageId}`);
    logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(responseFromEmail)}`);
    
    return responseFromEmail;
  }

  async sendSubscribeEmail(data) {
    let { first_name, last_name, email } = data.user;
    let text = `Dear ${first_name} ${last_name}\nYour subscription is being processed.\nYou will hear from our Afib Expert within 24 hours to chat.\nHave your questions ready.\nThank you for being a Club Afib Member.`

    let responseFromEmail = await this.transporter.sendMail({
      from: `"${config.mail_sender_name}" ${config.mail_sender_email}`,
      to: email,
      subject: 'Thank you for your subscription.',
      text
    });
    
    logger.info(`Message sent: ${responseFromEmail.messageId}`);
    logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(responseFromEmail)}`);
    
    return responseFromEmail;
  }
}

const readHTMLFile = function(path) {
  try{
    const file = fs.readFileSync(path, {encoding: 'utf-8'});
    return file;
  } catch(ex) {
    logger.error(ex);
    throw ex;
  }
};
  
const compileTemplate = function(replacements, templatePath) {
  const html = readHTMLFile(path.join(__dirname, templatePath));
  const template = handlebars.compile(html);

  const htmlToSend = template(replacements);
  return htmlToSend;
}

const theNodemailer = new NodemailerSmtpApi();
export default theNodemailer;