import bcrypt from 'bcryptjs';
import { QueryTypes } from 'sequelize';
import config from '../config';

const generatePasswordHash = function(password) {
  const saltRounds = 10;
  let salt = bcrypt.genSaltSync(saltRounds);
  let hash = bcrypt.hashSync(password, salt);
  return {hash, salt};
};

const user = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    facebook_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    google_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    apple_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 200],
      },
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: true
      },
      comment: '0 - patient, 1 - doctor',
    },
    phonenumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type:DataTypes.STRING,
      allowNull: true,
    },
    about: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripe_customer_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    salt: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: true
      },
      comment: '0 - created, 1 - active, 2 - blocked, 3 - delete',
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

  const generateUsername = async (first_name, last_name) => {
    const defaultUsername = `${first_name}${last_name}`.toLocaleLowerCase();
    let username = defaultUsername;
    if (!username || username.length === 0) username = "clubafibuser";
    let user = await User.findOne({
      where: { username },
    });
    let index = 1;
    while (user) {
      username = defaultUsername + index;
      user = await User.findOne({
        where: { username },
      });
      index++;
    }

    return username;
  }

  User.findByLogin = async login => {
    let user = await User.findOne({
      where: { email: login },
    });

    return user;
  };

  User.findByFacebook = async info => {
    const { id, email, first_name, last_name, photo } = info;
    let user = await User.findOne({
      where: { facebook_id: id }
    });
    let newUser = false;
    if (!user) {
      let emailDuplication = null;
      if (email && email.length > 0) {
        emailDuplication = await User.findOne({ where: { email }});
      }

      if (emailDuplication) {
        await User.update({ facebook_id: id }, { where: { id: emailDuplication.id } })
        user = { ...(emailDuplication.get({ plain: true })), facebook_id: id }
      } else {
        const username = await generateUsername(first_name, last_name);
        const result = await User.create({
          facebook_id: id,
          email,
          username,
          first_name,
          last_name,
          photo,
          password: '',
          status: 1
        })
        user = result.get({ plain: true });
        newUser = true;
      }
    }
    return { user, newUser };
  }
  
  User.findByGoogle = async info => {
    const { id, email, given_name, family_name, picture } = info;
    let user = await User.findOne({
      where: { google_id: id }
    });
    let newUser = false;
    if (!user) {
      let emailDuplication = null;
      if (email && email.length > 0) {
        emailDuplication = await User.findOne({ where: { email }});
      }

      if (emailDuplication) {
        await User.update({ google_id: id }, { where: { id: emailDuplication.id } })
        user = { ...(emailDuplication.get({ plain: true })), google_id: id }
      } else {
        const username = await generateUsername(given_name, family_name);
        const result = await User.create({
          google_id: id,
          email,
          username,
          first_name: given_name,
          last_name: family_name,
          photo: picture,
          password: '',
          status: 1
        })
        user = result.get({ plain: true });
        newUser = true;
      }
    }
    return { user, newUser };
  }

  User.findByApple = async info => {
    let { apple_id, email, first_name, last_name, photo } = info;
    if (!first_name || first_name.length === 0) {
      first_name = "clubafibuser";
    }
    let user = await User.findOne({
      where: { apple_id }
    });
    let newUser = false;
    if (!user) {
      let emailDuplication = null;
      if (email && email.length > 0) {
        emailDuplication = await User.findOne({ where: { email }});
      }

      if (emailDuplication) {
        await User.update({ apple_id }, { where: { id: emailDuplication.id } })
        user = { ...(emailDuplication.get({ plain: true })), apple_id }
      } else {
        const username = await generateUsername(first_name, last_name);
        const result = await User.create({
          apple_id,
          email,
          username,
          first_name,
          last_name,
          photo : photo || config.default_avatar,
          password: '',
          status: 1
        })
        user = result.get({ plain: true });
        newUser = true;
      }
    }
    return { user, newUser };
  }

  User.beforeCreate(function(user, options) {
    const {hash, salt} = generatePasswordHash(user.password);
    user.password = hash
    user.salt = salt
  });

  User.beforeBulkUpdate(function(user, options) {
    if (user.attributes && user.attributes.password) {
      const {hash, salt} = generatePasswordHash(user.attributes.password);
      user.attributes.password = hash
      user.attributes.salt = salt
    }
  });

  User.prototype.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);
  };

  return User;
};

export default user;