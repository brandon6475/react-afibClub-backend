import { Router } from 'express';
import models from '../../model';
import { Sequelize } from 'sequelize';

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

const GoodAttributes = [ 'id', 'name', 'description', 'image', 'price', 'link', 'createdAt', 'updatedAt' ];
const GoodIncludes = [
  {
    model: models.Reaction,
    attributes: ['user_id'],
    required: false,
    where: {
      type: 2,
      value: 1
    },
    as: 'likes'
  },
  {
    model: models.Reaction,
    attributes: ['user_id'],
    required: false,
    where: {
      type: 2,
      value: 2
    },
    as: 'dislikes'
  }
];

router.get('/article', async (req, res) => {
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

router.get('/article/:article_id', async (req, res) => {
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

router.get('/good', async (req, res) => {
  const goods = await models.Good.findAll({
    nest: true,
    raw: false,
    attributes: GoodAttributes,
    include: GoodIncludes,
    order: [ ['id', 'DESC'], ],
  });
  res.status(200).send({
    data: goods
  });
});

router.get('/good/:good_id', async (req, res) => {
  const { good_id } = req.params;
  const good = await models.Good.findOne({
    nest: true,
    raw: false,
    attributes: GoodAttributes,
    include: GoodIncludes,
    where: {
      id: good_id
    },
  });
  res.status(200).send({
    data: good
  });
});

router.get('/logo', async (req, res) => {
  const checkExist = await models.Logo.findByPk(1);

  res.status(200).send({
    data: { logo: checkExist ? checkExist.logo : '' }
  });
});

router.get('/category', async (req, res) => {
  const categories = await models.Category.findAll({
    nest: true,
    raw: false,
    attributes: ['id', 'title', 'color'],
    order: [ ['id', 'ASC'], ],
  });
  res.status(200).send({
    data: categories
  });
});

export default router;