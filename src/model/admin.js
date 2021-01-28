import bcrypt from 'bcryptjs';


const generatePasswordHash = function(password) {
  const saltRounds = 10;
  let salt = bcrypt.genSaltSync(saltRounds);
  let hash = bcrypt.hashSync(password, salt);
  return {hash, salt};
};

const admin = (sequelize, DataTypes) => {
  const Admin = sequelize.define('admin', {
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 200],
      },
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    phonenumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    photo: {
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

  Admin.findByLogin = async login => {
    const admin = await Admin.findOne({
      where: { email: login },
    });
    return admin;
  };

  Admin.beforeCreate(function(admin, options) {
    const {hash, salt} = generatePasswordHash(admin.password);
    admin.password = hash
    admin.salt = salt
  });

  Admin.beforeBulkUpdate(function(admin, options) {
    if (admin.attributes && admin.attributes.password) {
      const {hash, salt} = generatePasswordHash(admin.attributes.password);
      admin.attributes.password = hash
      admin.attributes.salt = salt
    }
  });

  Admin.prototype.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);
  };

  return Admin;
};

export default admin;