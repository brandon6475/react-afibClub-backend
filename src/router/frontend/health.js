import moment from 'moment';
import { Router } from 'express';
import { Sequelize } from 'sequelize';
import Joi from '@hapi/joi';
import models from '../../model';
import config from '../../config';
import logger from '../../middleware/logger';
import formidable from 'express-formidable';
import uploader from '../../middleware/uploader';

const Op = Sequelize.Op;

const addHeartRate = async (user_id, date, heart_rate, force = false) => {
  const row = await models.HeartRate.findOne({ where: { user_id, date } })
  if (row) {
    if (force) {
      await models.HeartRate.update({ heart_rate, status: 1 }, { where: { id: row.id } })
      return { ...(row.get({ plain: true })), heart_rate, status: 1 };
    } else {
      return row.get({ plain: true });
    }
  } else {
    const result = await models.HeartRate.create({ user_id, date, heart_rate })
    return result.get({ plain: true });
  }
  // const rows = await models.HeartRate.findAll({ where: { user_id, date }, order: [ ['heart_rate', 'ASC'] ] })
  // if (rows.length <= 1) {
  //   if (rows.length === 0 || (rows.length === 1 && rows[0].heart_rate !== heart_rate)) {
  //     const result = await models.HeartRate.create({ user_id, date, heart_rate })
  //     return result.get({ plain: true });
  //   }
  // } else {
  //   if (heart_rate < rows[0].heart_rate) {
  //     await models.HeartRate.update({ heart_rate }, { where: { id: rows[0].id } })
  //     // return { ...rows[0], heart_rate };
  //   } else if (heart_rate > rows[rows.length - 1].heart_rate) {
  //     await models.HeartRate.update({ heart_rate }, { where: { id: rows[rows.length - 1].id } })
  //     return { ...rows[rows.length - 1], heart_rate };
  //   }
  // }
}

const addEnergy = async (user_id, date, energy, force = false) => {
  const row = await models.Energy.findOne({ where: { user_id, date } })
  if (row) {
    if (force) {
      await models.Energy.update({ energy, status: 1 }, { where: { id: row.id } })
      return { ...(row.get({ plain: true })), energy, status: 1 };
    } else {
      return row.get({ plain: true });
    }
  } else {
    const result = await models.Energy.create({ user_id, date, energy })
    return result.get({ plain: true });
  }
}

const addExercise = async (user_id, date, exercise, force = false) => {
  const row = await models.Exercise.findOne({ where: { user_id, date } })
  if (row) {
    if (force) {
      await models.Exercise.update({ exercise, status: 1 }, { where: { id: row.id } })
      return { ...(row.get({ plain: true })), exercise, status: 1 };
    } else {
      return row.get({ plain: true });
    }
  } else {
    const result = await models.Exercise.create({ user_id, date, exercise })
    return result.get({ plain: true });
  }
}

const addStand = async (user_id, date, stand, force = false) => {
  const row = await models.Stand.findOne({ where: { user_id, date } })
  if (row) {
    if (force) {
      await models.Stand.update({ stand, status: 1 }, { where: { id: row.id } })
      return { ...(row.get({ plain: true })), stand, status: 1 };
    } else {
      return row.get({ plain: true });
    }
  } else {
    const result = await models.Stand.create({ user_id, date, stand })
    return result.get({ plain: true });
  }
}

const addWeight = async (user_id, date, weight, force = false) => {
  const row = await models.Weight.findOne({ where: { user_id, date } })
  if (row) {
    if (force) {
      await models.Weight.update({ weight, status: 1 }, { where: { id: row.id } })
      return { ...(row.get({ plain: true })), weight, status: 1 };
    } else {
      return row.get({ plain: true });
    }
  } else {
    const result = await models.Weight.create({ user_id, date, weight })
    return result.get({ plain: true });
  }
}

const addSteps = async (user_id, date, steps, force = false) => {
  const row = await models.Steps.findOne({ where: { user_id, date } })
  if (row) {
    if (force) {
      await models.Steps.update({ steps, status: 1 }, { where: { id: row.id } })
      return { ...(row.get({ plain: true })), steps, status: 1 };
    } else {
      return row.get({ plain: true });
    }
  } else {
    const result = await models.Steps.create({ user_id, date, steps })
    return result.get({ plain: true });
  }
}

const addSleep = async (user_id, uuid, start, end, type, force = false) => {
  const row = await models.Sleep.findOne({ where: { user_id, uuid } })
  if (uuid && row) {
    if (force) {
      await models.Sleep.update({ start, end, type, status: 1 }, { where: { id: row.id } })
      return { ...(row.get({ plain: true })), start, end, type, status: 1 };
    } else {
      return row.get({ plain: true });
    }
  } else {
    const result = await models.Sleep.create({ user_id, uuid, start, end, type })
    return result.get({ plain: true });
  }
}

const addAlcohol = async (user_id, date, alcohol, force = false) => {
  const row = await models.Alcohol.findOne({ where: { user_id, date } })
  if (row) {
    if (force) {
      await models.Alcohol.update({ alcohol, status: 1 }, { where: { id: row.id } })
      return { ...(row.get({ plain: true })), alcohol, status: 1 };
    } else {
      return row.get({ plain: true });
    }
  } else {
    const result = await models.Alcohol.create({ user_id, date, alcohol })
    return result.get({ plain: true });
  }
}

const addBloodPressure = async (user_id, date, sys_uuid, systolic, dia_uuid, diastolic, force = false) => {
  const row = await models.BloodPressure.findOne({ where: { user_id, date } })
  if (row) {
    if (force) {
      await models.BloodPressure.update({ date, systolic, diastolic, status: 1 }, { where: { id: row.id } })
      return { ...(row.get({ plain: true })), date, systolic, diastolic, status: 1 };
    } else {
      return row.get({ plain: true });
    }
  } else {
    const result = await models.BloodPressure.create({ user_id, date, sys_uuid, systolic, dia_uuid, diastolic })
    return result.get({ plain: true });
  }
}

const addECG = async (user_id, date, type, avgHeartRate, voltages) => {
  const row = await models.ECG.findOne({ where: { user_id, date } })
  if (row) {
    return row.get({ plain: true });
  } else {
    const result = await models.ECG.create({ user_id, date, type, avgHeartRate, voltages })
    return result.get({ plain: true });
  }
}

const addEKG = async (user_id, date, type, avgHeartRate, file_url) => {
  const row = await models.EKG.findOne({ where: { user_id, date } })
  if (row) {
    return row.get({ plain: true });
  } else {
    const result = await models.EKG.create({ user_id, date, type, avgHeartRate, file_url })
    return result.get({ plain: true });
  }
}

const router = Router();

router.get('/heart_rate', async (req, res) => {
  const { id } = req.user;
  const { lastAt } = req.query;
  try {
    let condition = { user_id: id };
    if (lastAt) {
      condition = {
        ...condition,
        date: { [Op.gt]: lastAt }
      }
    }
    const heartRates = await models.HeartRate.findAll({ where: condition, order: [ ['date', 'ASC'] ] })
    let data = [];
    for (let item of heartRates) {
      const values = item.dataValues;
      data.push({
        ...values,
        date: moment(values.date).format("YYYY-MM-DDTHH:mm:ssZ"),
      })
    }

    res.status(200).send({
      data
    });
  } catch (err) {
    logger.error('Error on get heart rate data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/heart_rate', async (req, res) => {
  const { id } = req.user;
  let { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.array().items(Joi.object().keys({
      date: Joi.date().required(),
      heart_rate: Joi.number().required(),
    })).required(),
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let promises = []

    // data.sort(function(a, b){return new Date(a.date)-new Date(b.date)});
    // let currentDate = '';
    // let min = 0;
    // let max = 0;

    // if (data.length > 0) {
    //   for (let i = 0; i < data.length; i++) {
    //     let item = data[i];

    //     if (i === 0 || (i !== 0 && currentDate !== moment(item.date).startOf('hour').format("YYYY-MM-DD HH:00:00"))) {
    //       currentDate = moment(item.date).startOf('hour').format("YYYY-MM-DD HH:00:00");
    //       min = item.heart_rate;
    //       max = item.heart_rate;
    //     } else {
    //       if (min > item.heart_rate) {
    //         min = item.heart_rate;
    //       } else if (max < item.heart_rate) {
    //         max = item.heart_rate;
    //       } else {
    //         continue;
    //       }
    //     }
    //     const date = moment(item.date).startOf('hour').format("YYYY-MM-DD HH:00:00");
    //     promises.push(addHeartRate(id, date, item.heart_rate))
    //     // await addHeartRate(id, date, item.heart_rate)
    //   }
    // }
    
    for (let item of data) {
      const date = moment(item.date).format("YYYY-MM-DDTHH:mm:ssZ");
      promises.push(addHeartRate(id, date, item.heart_rate))
    }
    await Promise.all(promises)
    
    res.status(200).send({
      data: { msg: 'success' }
    });
  } catch (err) {
    logger.error('Error on save heart rate data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/energy', async (req, res) => {
  const { id } = req.user;

  try {
    const energy = await models.Energy.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: energy
    });
  } catch (err) {
    logger.error('Error on get energy berned data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/energy', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.array().items(Joi.object().keys({
      date: Joi.date().required(),
      energy: Joi.number().required(),
    })).required(),
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let promises = []
    for (let item of data) {
      const date = moment(item.date).startOf('hour');
      promises.push(addEnergy(id, date, item.energy))
    }
    await Promise.all(promises)

    const energy = await models.Energy.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: energy
    });
  } catch (err) {
    logger.error('Error on save energy berned data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/exercise', async (req, res) => {
  const { id } = req.user;

  try {
    const exercise = await models.Exercise.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: exercise
    });
  } catch (err) {
    logger.error('Error on get exercise data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/exercise', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.array().items(Joi.object().keys({
      date: Joi.date().required(),
      exercise: Joi.number().required(),
    })).required(),
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let promises = []
    for (let item of data) {
      const date = moment(item.date).startOf('hour');
      promises.push(addExercise(id, date, item.exercise))
    }
    await Promise.all(promises)

    const exercise = await models.Exercise.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: exercise
    });
  } catch (err) {
    logger.error('Error on save exercise data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/stand', async (req, res) => {
  const { id } = req.user;

  try {
    const stand = await models.Stand.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: stand
    });
  } catch (err) {
    logger.error('Error on get stand data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/stand', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.array().items(Joi.object().keys({
      date: Joi.date().required(),
      stand: Joi.number().required(),
    })).required(),
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let promises = []
    for (let item of data) {
      const date = moment(item.date).startOf('hour');
      promises.push(addStand(id, date, item.stand))
    }
    await Promise.all(promises)

    const stand = await models.Stand.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: stand
    });
  } catch (err) {
    logger.error('Error on save stand data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/weight', async (req, res) => {
  const { id } = req.user;

  try {
    const weights = await models.Weight.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: weights
    });
  } catch (err) {
    logger.error('Error on get weight data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/weight', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.array().items(Joi.object().keys({
      date: Joi.date().required(),
      weight: Joi.number().required(),
    })).required(),
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let promises = []
    for (let item of data) {
      const date = moment(item.date).startOf('hour');
      promises.push(addWeight(id, date, item.weight))
    }
    await Promise.all(promises)

    const weights = await models.Weight.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: weights
    });
  } catch (err) {
    logger.error('Error on save weight data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/weight/add', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.object().keys({
      date: Joi.date().required(),
      weight: Joi.number().required(),
    })
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const date = moment(data.date).startOf('hour');
    
    const row = await addWeight(id, date, data.weight, true)
    res.status(200).send({
      data: row
    });
  } catch (err) {
    logger.error('Error on add weight data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/weight/delete', async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.body
  
  const schema = Joi.object().keys({
    id: Joi.number().min(1).max(Math.pow(2,31)-1).required(),
  });

  try {
    Joi.assert({ id }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const row = await models.Weight.findOne({ where: { id, user_id } })

    if (!row) {
      return res.status(403).send({
        errors: [{ message: `Weight item isn\'t exist with id: ${id}` }]
      });
    }
    
    await models.Weight.update({ status: 2 }, { where: {id} })

    res.status(200).send({
      data: { id }
    });
  } catch (err) {
    logger.error('Error on delete weight data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/steps', async (req, res) => {
  const { id } = req.user;

  try {
    const steps = await models.Steps.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: steps
    });
  } catch (err) {
    logger.error('Error on get steps data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/steps', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.array().items(Joi.object().keys({
      date: Joi.date().required(),
      steps: Joi.number().required(),
    })).required(),
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let promises = []
    for (let item of data) {
      const date = moment(item.date).format("YYYY-MM-DD HH:mm:ss");
      promises.push(addSteps(id, date, item.steps))
    }
    await Promise.all(promises)

    const steps = await models.Steps.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: steps
    });
  } catch (err) {
    logger.error('Error on save steps data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/sleep', async (req, res) => {
  const { id } = req.user;

  try {
    const sleeps = await models.Sleep.findAll({ where: { user_id: id }, order: [ ['start', 'ASC'] ] })
    
    res.status(200).send({
      data: sleeps
    });
  } catch (err) {
    logger.error('Error on get sleep data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/sleep', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.array().items(Joi.object().keys({
      uuid: Joi.string().allow('', null),
      start: Joi.date().required(),
      end: Joi.date().required(),
      type: Joi.number().required(),
    })).required(),
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let promises = []
    for (let item of data) {
      const { uuid = "", start, end, type } = item;
      promises.push(addSleep(id, uuid, start, end, parseInt(type)));
    }
    await Promise.all(promises)

    const sleeps = await models.Sleep.findAll({ where: { user_id: id }, order: [ ['start', 'ASC'] ] })
    
    res.status(200).send({
      data: sleeps
    });
  } catch (err) {
    logger.error('Error on save sleep data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/sleep/add', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.object().keys({
      uuid: Joi.string().allow('', null),
      start: Joi.date().required(),
      end: Joi.date().required(),
      type: Joi.number().required(),
    })
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const { uuid = "", start, end, type } = data;
    const row = await addSleep(id, uuid, start, end, parseInt(type), true)
    res.status(200).send({
      data: row
    });
  } catch (err) {
    logger.error('Error on add sleep data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/sleep/delete', async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.body
  
  const schema = Joi.object().keys({
    id: Joi.number().min(1).max(Math.pow(2,31)-1).required(),
  });

  try {
    Joi.assert({ id }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const row = await models.Sleep.findOne({ where: { id, user_id } })

    if (!row) {
      return res.status(403).send({
        errors: [{ message: `Sleep item isn\'t exist with id: ${id}` }]
      });
    }
    
    await models.Sleep.update({ status: 2 }, { where: {id} })

    res.status(200).send({
      data: { id }
    });
  } catch (err) {
    logger.error('Error on delete sleep data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/alcohol', async (req, res) => {
  const { id } = req.user;

  try {
    const alcohols = await models.Alcohol.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: alcohols
    });
  } catch (err) {
    logger.error('Error on get alcohol use data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/alcohol', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.array().items(Joi.object().keys({
      date: Joi.date().required(),
      alcohol: Joi.number().required(),
    })).required(),
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let promises = []
    for (let item of data) {
      const date = moment(item.date).startOf('hour');
      promises.push(addAlcohol(id, date, item.alcohol))
    }
    await Promise.all(promises)

    const alcohols = await models.Alcohol.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: alcohols
    });
  } catch (err) {
    logger.error('Error on save alcohol use data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/alcohol/add', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.object().keys({
      date: Joi.date().required(),
      alcohol: Joi.number().required(),
    })
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const date = moment(data.date).startOf('hour');
    
    const row = await addAlcohol(id, date, data.alcohol, true)
    res.status(200).send({
      data: row
    });
  } catch (err) {
    logger.error('Error on add alcohol data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/alcohol/delete', async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.body
  
  const schema = Joi.object().keys({
    id: Joi.number().min(1).max(Math.pow(2,31)-1).required(),
  });

  try {
    Joi.assert({ id }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const row = await models.Alcohol.findOne({ where: { id, user_id } })

    if (!row) {
      return res.status(403).send({
        errors: [{ message: `Alcohol item isn\'t exist with id: ${id}` }]
      });
    }
    
    await models.Alcohol.update({ status: 2 }, { where: {id} })

    res.status(200).send({
      data: { id }
    });
  } catch (err) {
    logger.error('Error on delete alcohol use data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/blood_pressure', async (req, res) => {
  const { id } = req.user;

  try {
    const bloodPressures = await models.BloodPressure.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: bloodPressures
    });
  } catch (err) {
    logger.error('Error on get blood pressure data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/blood_pressure', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.array().items(Joi.object().keys({
      date: Joi.date().required(),
      sys_uuid: Joi.string().allow('', null),
      systolic: Joi.number().required(),
      dia_uuid: Joi.string().allow('', null),
      diastolic: Joi.number().required(),
    })).required(),
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let promises = []
    for (let item of data) {
      const date = moment(item.date).startOf('hour');
      const { sys_uuid = "", systolic, dia_uuid = "", diastolic } = item;
      promises.push(addBloodPressure(id, date, sys_uuid, systolic, dia_uuid, diastolic));
    }
    await Promise.all(promises)

    const bloodPressures = await models.BloodPressure.findAll({ where: { user_id: id }, order: [ ['date', 'ASC'] ] })
    
    res.status(200).send({
      data: bloodPressures
    });
  } catch (err) {
    logger.error('Error on save blood pressure data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/blood_pressure/add', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.object().keys({
      date: Joi.date().required(),
      sys_uuid: Joi.string().allow('', null),
      systolic: Joi.number().required(),
      dia_uuid: Joi.string().allow('', null),
      diastolic: Joi.number().required(),
    })
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const date = moment(data.date).startOf('hour');
    
    const { sys_uuid = "", systolic, dia_uuid = "", diastolic } = data;
    const row = await addBloodPressure(id, date, sys_uuid, systolic, dia_uuid, diastolic, true)
    res.status(200).send({
      data: row
    });
  } catch (err) {
    logger.error('Error on add blood pressure data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/blood_pressure/delete', async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.body
  
  const schema = Joi.object().keys({
    id: Joi.number().min(1).max(Math.pow(2,31)-1).required(),
  });

  try {
    Joi.assert({ id }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const row = await models.BloodPressure.findOne({ where: { id, user_id } })

    if (!row) {
      return res.status(403).send({
        errors: [{ message: `Blood pressure item isn\'t exist with id: ${id}` }]
      });
    }
    
    await models.BloodPressure.update({ status: 2 }, { where: {id} })

    res.status(200).send({
      data: { id }
    });
  } catch (err) {
    logger.error('Error on delete blood pressure data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/ecg', async (req, res) => {
  const { id } = req.user;
  const { lastAt } = req.query;
  try {
    let condition = { user_id: id };
    if (lastAt) {
      condition["date"] = { [Op.gt]: lastAt };
    }
    const ecgs = await models.ECG.findAll({ where: condition, order: [ ['date', 'ASC'] ] })
    let data = [];
    for (let item of ecgs) {
      const values = item.dataValues;
      data.push({
        ...values,
        date: moment(values.date).format("YYYY-MM-DDTHH:mm:ssZ"),
        voltages: JSON.parse(item.voltages)
      })
    }
    res.status(200).send({
      data
    });
  } catch (err) {
    logger.error('Error on getting ecg data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/ecg', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.array().items(Joi.object().keys({
      date: Joi.date().required(),
      type: Joi.number().required(),
      avgHeartRate: Joi.number().required(),
      voltages: Joi.array().required()
    })).required(),
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let promises = []
    for (let item of data) {
      const { type, avgHeartRate } = item;
      const date = moment(item.date).format('YYYY-MM-DDTHH:mm:ssZ');
      let voltages = JSON.stringify(item.voltages);
      voltages = voltages.replace(/time/g, "t");
      voltages = voltages.replace(/value/g, 'v');
      promises.push(addECG(id, date, type, avgHeartRate, voltages));
    }
    await Promise.all(promises)
    
    res.status(200).send({
      data: { msg: 'success' }
    });
  } catch (err) {
    logger.error('Error on saving ecg data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/ecg/:ecg_id', async (req, res) => {
  const { ecg_id } = req.params;

  try {
    let condition = { id: ecg_id };
    const ecg = await models.ECG.findOne({ where: condition });
    res.status(200).send({
      data: ecg
    });
  } catch (err) {
    logger.error('Error on getting ecg data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/upload', formidable(), async (req, res) => {
  const { file } = req.files;

  try {
    let fileURL = await uploader.uploadFile(file);
    res.status(200).send(fileURL.Location);
  } catch (err) {
    logger.error('Error on uploading health file:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/ekg', async (req, res) => {
  const { id } = req.user;
  const { lastAt } = req.query;
  try {
    let condition = { user_id: id };
    if (lastAt) {
      condition["date"] = { [Op.gt]: lastAt };
    }
    const ecgs = await models.EKG.findAll({ where: condition, order: [ ['date', 'ASC'] ] })
    let data = [];
    for (let item of ecgs) {
      const values = item.dataValues;
      data.push({
        ...values,
        date: moment(values.date).format("YYYY-MM-DDTHH:mm:ssZ"),
      })
    }
    res.status(200).send({
      data
    });
  } catch (err) {
    logger.error('Error on getting ekg data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/ekg', async (req, res) => {
  const { id } = req.user;
  const { data } = req.body
  
  const schema = Joi.object().keys({
    data: Joi.array().items(Joi.object().keys({
      date: Joi.date().required(),
      type: Joi.number().required(),
      avgHeartRate: Joi.number().required(),
      file_url: Joi.string().required()
    })).required(),
  });

  try {
    Joi.assert({ data }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let promises = []
    for (let item of data) {
      const { type, avgHeartRate, file_url } = item;
      const date = moment(item.date).format('YYYY-MM-DDTHH:mm:ssZ');
      promises.push(addEKG(id, date, type, avgHeartRate, file_url));
    }
    await Promise.all(promises)
    
    res.status(200).send({
      data: { msg: 'success' }
    });
  } catch (err) {
    logger.error('Error on saving ecg data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.get('/ecg-records', async (req, res) => {
  const { id } = req.user;
  try {
    let condition = { user_id: id };
    const ecgs = await models.EKG.findAll({ where: condition, order: [ ['date', 'ASC'] ], attributes: ['id', 'date', 'type'] })
    let data = [];
    for (let item of ecgs) {
      const values = item.dataValues;
      data.push({
        ...values,
        date: moment(values.date).format("YYYY-MM-DD HH:mm:ss"),
      })
    }
    res.status(200).send({
      data
    });
  } catch (err) {
    logger.error('Error on getting ecg data:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/ecg-detail', async (req, res) => {
  const { id } = req.user;
  const { from, index, chart_type, ecg_type } = req.body
  
  try {
    let from_date = `${from} 00:00:00`;
    let type = parseInt(ecg_type, 10);
    let indexVal = parseInt(index, 10);
    let add_param = '';
    if (chart_type === 'daily') {
      add_param = 'hours';
    } else if (chart_type === 'weekly') {
      add_param = 'days';
    } else if (chart_type === 'monthly') {
      add_param = 'days';
    } else if (chart_type === 'yearly') {
      add_param = 'months';
    }
    let search_start_date = moment(from_date).add(indexVal, add_param).format("YYYY-MM-DD HH:00:00");
    let search_end_date = moment(from_date).add(indexVal+1, add_param).format("YYYY-MM-DD HH:00:00");

    let condition = { 
      user_id: id,
      date: {
        [Op.and]: [
          { [Op.gte]: search_start_date },
          { [Op.lt]: search_end_date },
        ]
      },
      type: type <= 2 ? {
        [Op.eq]: type
      } : {
        [Op.and]: [
          { [Op.gte]: type },
          { [Op.lte]: type+1 },
        ]
      }
    };
    const ecgs = await models.EKG.findAll({ where: condition, order: [ ['date', 'ASC'] ] })
    let data = [];
    for (let item of ecgs) {
      const values = item.dataValues;

      let voltages = [];
      const originBuff = await uploader.readFile(values.file_url)
      const length = originBuff.length;
      let totalCount = Math.floor(length / 16);

      for (let i = 0; i < totalCount; i++) {
        let t = originBuff.readDoubleLE(i * 16);
        let v = originBuff.readDoubleLE(i * 16 + 8);
        voltages.push([t, v]);
      }

      data.push({
        ...values,
        date: moment(values.date).format("YYYY-MM-DD HH:mm:ss"),
        voltages,
      })
    }
    
    res.status(200).send({
      data
    });
  } catch (err) {
    logger.error('Error on getting ecg detail:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

export default router;