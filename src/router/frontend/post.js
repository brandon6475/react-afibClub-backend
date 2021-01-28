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
		order: [ 
      ['id', 'DESC'],
      [{ model: models.Comment, as : 'comments' }, 'id', 'ASC'],
    ],
  });
  res.status(200).send({
    data: posts
  });
});

router.get('/mine', async (req, res) => {
  const { id } = req.user;
  const posts = await models.Post.findAll({
    nest: true,
    raw: false,
    attributes: PostAttributes,
    include: PostIncludes,
    where: {
      user_id: id
		},
		order: [ 
      ['id', 'DESC'],
      [{ model: models.Comment, as : 'comments' }, 'id', 'ASC'],
    ],
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
    order: [ 
      [{ model: models.Comment, as : 'comments' }, 'id', 'ASC'],
    ],
  });
  res.status(200).send({
    data: post
  });
});

router.post('/:post_id', async (req, res) => {
  const { post_id } = req.params;
  const { nickname, image, title, content } = req.body
  const { id } = req.user;
  
  const schema = Joi.object().keys({
    nickname: Joi.string().required(),
    content: Joi.string().required(),
  });

  try {
    Joi.assert({ nickname, content }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let post = {};
    if (parseInt(post_id, 10) === 0) {
      const result = await models.Post.create({
        user_id: id,
        nickname,
        image: image || '',
        title: title || '',
        content
      })
      post = result.get({ plain: true });
    } else {
      await models.Post.update({ nickname, image: image || '', title: title || '', content }, { where: { id: post_id } });
      post = await models.Post.findByPk(post_id);
    }
    let { createdAt, updatedAt } = post;
    res.status(200).send({
      data: { post: { nickname, id: post.id, image: image || '', title: title || '', content, createdAt, updatedAt } }
    });
  } catch (err) {
    logger.error('Error on creating post:', err);
    res.status(500).send({
      errors: [err]
    });
  }
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