import { Router } from 'express';
import { Sequelize } from 'sequelize';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';

const Op = Sequelize.Op;

const router = Router();

const PostAttributes = [ 'id', 'nickname', 'image', 'title', 'content', 'createdAt', 'updatedAt' ];
const PostIncludes = [
  {
    model: models.User, 
    attributes: ['id', 'photo', 'username', 'first_name', 'last_name', 'type', 'subject'],
    as: 'creator',
  },
  {
    model: models.Comment,
    attributes: ['id', 'post_id', 'text', 'user_id', 'createdAt', 'updatedAt'],
    order: [ ['Comment.id', 'ASC'], ],
    as: 'comments',
    include: [
      {
        model: models.User,
        attributes: ['id', 'username', 'first_name', 'last_name', 'photo', 'type', 'subject'],
        as: 'user'
			},
			{
				model: models.Reaction,
				attributes: ['user_id'],
				required: false,
				where: {
					type: 3,
					value: 1
				},
				as: 'likes'
			},
			{
				model: models.Reaction,
				attributes: ['user_id'],
				required: false,
				where: {
					type: 3,
					value: 2
				},
				as: 'dislikes'
			}
    ]
  },
  {
    model: models.Reaction,
    attributes: ['user_id'],
    required: false,
    where: {
      type: 0,
      value: 1
    },
    as: 'likes'
  },
  {
    model: models.Reaction,
    attributes: ['user_id'],
    required: false,
    where: {
      type: 0,
      value: 2
    },
    as: 'dislikes'
  }
];

router.get('/', async (req, res) => {
  const posts = await models.Post.findAll({
    nest: true,
    raw: false,
    attributes: PostAttributes,
		include: PostIncludes,
		order: [ ['id', 'DESC'], ],
  });
  res.status(200).send({
    data: posts
  });
});

router.get('/:post_id', async (req, res) => {
  const { post_id } = req.params;
  const post = await models.Post.findOne({
    nest: true,
    raw: false,
    attributes: PostAttributes,
    include: PostIncludes,
    where: {
      id: post_id
    },
  });
  res.status(200).send({
    data: post
  });
});

router.post('/delete/:post_id', async (req, res) => {
  const { post_id } = req.params;

  try {
    await models.Post.destroy({ where: { id: post_id } });
    await models.Comment.destroy({ where: { post_id: post_id }});
    await models.Reaction.destroy({ where: { relation_id: post_id, type: 0 }});
    res.status(200).send({
      data: { msg: 'success' }
    });
  } catch (err) {
    logger.error('Error on deleting post:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;