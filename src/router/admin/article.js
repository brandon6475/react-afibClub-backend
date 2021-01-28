import { Router } from 'express';
import { Sequelize } from 'sequelize';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';

const Op = Sequelize.Op;

const router = Router();

const ArticleAttributes = [ 'id', 'banner', 'caption', 'title', 'description', 'category', 'show_order', 'createdAt', 'updatedAt' ];
const ArticleIncludes = [
  {
    model: models.Reaction,
    attributes: ['user_id'],
    required: false,
    where: {
      type: 1,
      value: 1
    },
    as: 'likes'
  },
  {
    model: models.Reaction,
    attributes: ['user_id'],
    required: false,
    where: {
      type: 1,
      value: 2
    },
    as: 'dislikes'
  }
];

router.get('/', async (req, res) => {
  const articles = await models.Article.findAll({
    nest: true,
    raw: false,
    attributes: ArticleAttributes,
    include: ArticleIncludes,
    order: [ ['show_order', 'ASC'], ],
  });
  res.status(200).send({
    data: articles
  });
});

router.get('/mine', async (req, res) => {
  const { id } = req.user;
  const articles = await models.Article.findAll({
    nest: true,
    raw: false,
    attributes: ArticleAttributes,
    include: ArticleIncludes,
    where: {
      admin_id: id
    },
    order: [ ['show_order', 'ASC'], ],
  });
  res.status(200).send({
    data: articles
  });
});

router.get('/:article_id', async (req, res) => {
  const { article_id } = req.params;
  const article = await models.Article.findOne({
    nest: true,
    raw: false,
    attributes: ArticleAttributes,
    include: ArticleIncludes,
    where: {
      id: article_id
    },
  });
  res.status(200).send({
    data: article
  });
});

router.post('/:article_id', async (req, res) => {
  const { article_id } = req.params;
  let { banner, caption, title, description, category, show_order } = req.body
  const { id } = req.user;
  
  const schema = Joi.object().keys({
    banner: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.number().required(),
    show_order: Joi.number().required()
  });

  try {
    Joi.assert({ banner, title, description, category, show_order }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    if (show_order !== 0) {
      if (parseInt(article_id, 10) === 0) {
        await models.Article.increment('show_order', { by: 1, where: { show_order: { [Op.gte] : show_order }}})
      } else {
        const originArticle = await models.Article.findByPk(article_id);
        if (show_order > originArticle.show_order) { // go down
          await models.Article.decrement('show_order', { by: 1, where: {
            show_order: {
              [Op.gt] : originArticle.show_order,
              [Op.lte] : show_order
            }}})
        } else if (show_order < originArticle.show_order) { // go up
          await models.Article.increment('show_order', { by: 1, where: {
            show_order: {
              [Op.gte] : show_order,
              [Op.lt] : originArticle.show_order
            }}})
        }
      }
    } else {
      if (parseInt(article_id, 10) !== 0) {
        const originArticle = await models.Article.findByPk(article_id);
        await models.Article.decrement('show_order', { by: 1, where: { show_order: { [Op.gt] : originArticle.show_order }}})
      }
      let maxOrder = await models.Article.max('show_order');
      show_order = parseInt(maxOrder, 10) + 1;
    }

    if (parseInt(article_id, 10) === 0) {
      await models.Article.create({
        admin_id: id,
        banner, caption, title, description, category, show_order
      })
    } else {
      await models.Article.update({ banner, caption, title, description, category, show_order }, { where: { id: article_id } });
    }
    const articles = await models.Article.findAll({
      nest: true,
      raw: false,
      attributes: ArticleAttributes,
      include: ArticleIncludes,
      where: {
        admin_id: id
      },
      order: [ ['show_order', 'ASC'], ],
    });
    res.status(200).send({
      data: articles
    });
  } catch (err) {
    logger.error('Error on creating article:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/delete/:article_id', async (req, res) => {
  const { article_id } = req.params;

  try {
    await models.Article.destroy({ where: { id: article_id } });
    await models.Reaction.destroy({ where: { relation_id: article_id, type: 1 }});
    res.status(200).send({
      data: { msg: 'success' }
    });
  } catch (err) {
    logger.error('Error on deleting article:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;