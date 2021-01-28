import Sequelize from 'sequelize';

import logger from '../middleware/logger';

const Op = Sequelize.Op;

const adminLogin = (sequelize, DataTypes) => {
  const AdminLogin = sequelize.define('admin_login', {
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    login_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: true
      },
      comment: '0 - web, 1 - mobile',
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    lifetime: {
      type: DataTypes.BIGINT,
    },
    login: DataTypes.DATE,
    refresh: DataTypes.DATE,
    logout: DataTypes.DATE,
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: true
      },
      comment: '0 - login, 1 - refresh, 2 - timeout, 3 - logout',
    },
    createdAt: {
      field: 'create_date',
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      field: 'update_date',
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  AdminLogin.beforeCreate(async adminLogin => {
    try {
      await AdminLogin.expireOldLogins(adminLogin.admin_id, adminLogin.login_type);
    } catch (e) {
      logger.error(`Error on expiring old refresh tokens: ${e}`)
    }

    adminLogin.login = new Date().toLocaleString()
  });

  AdminLogin.expireOldLogins = async function(admin_id, login_type) {
    await AdminLogin.update({ logout: new Date().toLocaleString(), status: 3 }, { where: { admin_id, login_type, status: { [Op.lt]: 2 } }});
  };

  return AdminLogin;
};

export default adminLogin;