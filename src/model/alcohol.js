const alcohol = (sequelize, DataTypes) => {
  const Alcohol = sequelize.define('alcohol', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true
      },
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    alcohol: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: true,
      },
      comment: '0 - create, 1 - edit, 2 - delete',
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

  return Alcohol;
};

export default alcohol;