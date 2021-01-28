import { Router } from 'express';
import Sequelize from 'sequelize';
import Joi from '@hapi/joi';
import logger from '../../middleware/logger';
import config from '../../config';
import { db } from '../../middleware/firestore';
import models from '../../model';
import * as admin from 'firebase-admin';
const Op = Sequelize.Op;

const router = Router();

router.post('/', async (req, res) => {
  const { doctor_id } = req.body;
  const { id } = req.user;

  const schema = Joi.object().keys({
    doctor_id: Joi.number().min(1).required()
  });

  try {
    Joi.assert({ doctor_id }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const currentDate = new Date();//.getTime();

    const snapshot = await db.collection('rooms')
                          .where('status', '==', 0)
                          .where('user_id', '==', id)
                          .where('doctor_id', '==', parseInt(doctor_id, 10)).get();
    if (!snapshot.empty) {
      return res.status(403).send({
        errors: [{ 
          room_id: snapshot.docs[0].id,
          message: `Opened room already exists`
        }]
      });
    }
    
    const checkSpent = await db.collection('rooms')
                          .where('user_id', '==', id).get();
    if (!checkSpent.empty) {
      const paymentCheck = await models.Payment.findOne({ where: { user_id: id, status: { [Op.lt]: 2 } } });
      if (!paymentCheck) {
        return res.status(403).send({
          errors: [{
            message: `You are not allowed to create any chat. Please upgrade plan.`
          }]
        });
      }
    }

    const subscription = await models.Payment.findOne({ where: { user_id: id, status: { [Op.lt]: 2 }, type: { [Op.gt]: 0 } } });
    if (!subscription) {
      const oneTimeCheck = await models.Payment.findOne({ where: { user_id: id, status: { [Op.lt]: 2 }, type: 0 } });
      if (oneTimeCheck) {
        await oneTimeCheck.update({ status: 2 });
      }
    }
  
    const response = await db.collection('rooms').add({
      name: `Room-${currentDate.getTime()}`,
      status: 0,
      user_id: id,
      doctor_id: parseInt(doctor_id, 10),
      createdAt: admin.firestore.Timestamp.fromDate(currentDate)//currentStamp
    });
    res.status(200).send({
      data: { room_id: response.id }
    });
  } catch (err) {
    logger.error('Error on creating chat:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/close', async (req, res) => {
  const { room_id } = req.body;

  const schema = Joi.object().keys({
    room_id: Joi.string().required()
  });

  try {
    Joi.assert({ room_id }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const cityRef = db.collection('rooms').doc(room_id);

    const response = await cityRef.update({
      status: 1
    });

    res.status(200).send({
      data: { msg: 'success'}
    });
  } catch (err) {
    logger.error('Error on closing chat:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;