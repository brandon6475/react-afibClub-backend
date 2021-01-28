import { Router } from 'express';
import { Sequelize } from 'sequelize';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';

const router = Router();

router.get('/:post_id', async (req, res) => {
  const { post_id } = req.params;
  const comments = await models.Comment.findAll({
    nest: true,
    raw: false,
    attributes: [ 'id', 'post_id', 'text', 'createdAt', 'updatedAt' ],
    include: [
      {
        model: models.User, 
        attributes: ['id', 'photo', 'username', 'first_name', 'last_name', 'type', 'subject'],
        as: 'user',
      }
    ],
    where: {
      post_id: post_id
    },
    order: [ ['id', 'ASC'], ],
  });
  res.status(200).send({
    data: comments
  });
});

router.post('/:comment_id', async (req, res) => {
  const { comment_id } = req.params;
  const { post_id, text } = req.body
  const { id, photo, username, first_name, last_name, type, subject } = req.user;
  
  const schema = Joi.object().keys({
    post_id: Joi.number().required(),
    text: Joi.string().required(),
  });

  try {
    Joi.assert({ post_id, text }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let comment = {};
    if (parseInt(comment_id, 10) === 0) {
      const result = await models.Comment.create({
        user_id: id,
        post_id,
        text
      })
      comment = result.get({ plain: true });
    } else {
      await models.Comment.update({ text }, { where: { id: comment_id } });
      comment = await models.Comment.findByPk(comment_id);
    }
    let { createdAt, updatedAt } = comment;
    res.status(200).send({
      data: { comment: { id: comment.id, post_id, text, createdAt, updatedAt, user: {id, photo, username, first_name, last_name, type, subject} } }
    });
  } catch (err) {
    logger.error('Error on leaving comment:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/delete/:comment_id', async (req, res) => {
  const { comment_id } = req.params;

  try {
    await models.Comment.destroy({ where: { id: comment_id } });
    res.status(200).send({
      data: { msg: 'success' }
    });
  } catch (err) {
    logger.error('Error on deleting comment:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;