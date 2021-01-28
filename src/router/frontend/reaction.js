import { Router } from 'express';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';

const router = Router();

router.post('/', async (req, res) => {
  let { relation_id, type, value } = req.body
  const { id } = req.user;
  
  const schema = Joi.object().keys({
    relation_id: Joi.number().required(),
    type: Joi.number().required(),
    value: Joi.number().min(1).required(),
  });

  try {
    Joi.assert({ relation_id, type, value  }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const duplication = await models.Reaction.findOne({ where: { relation_id, type, user_id: id } });
    if (duplication) {
      value = duplication.value != value ? value : 0;
      await models.Reaction.update({ value }, { where: { id: duplication.id }});
    } else {
      await models.Reaction.create({ relation_id, type, user_id: id, value });
    }
    
    let related_model = {};
    if (type == 0) {
      related_model = models.Post;
    } else if (type == 1) {
      related_model = models.Article;
    } else if (type == 2) {
      related_model = models.Good;
    } else if (type == 3) {
      related_model = models.Comment;
    }
    const related_row = await related_model.findOne({
      nest: true,
      raw: false,
      include: [
        {
          model: models.Reaction,
          attributes: ['user_id'],
          required: false,
          where: {
            type: type,
            value: 1
          },
          as: 'likes'
        },
        {
          model: models.Reaction,
          attributes: ['user_id'],
          required: false,
          where: {
            type: type,
            value: 2
          },
          as: 'dislikes'
        }
      ],
      where: {
        id: relation_id
      }
    })
    const { likes, dislikes } = related_row;
    res.status(200).send({
      data: { value, type, relation_id, likes, dislikes }
    });
  } catch (err) {
    logger.error('Error on making reaction:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;