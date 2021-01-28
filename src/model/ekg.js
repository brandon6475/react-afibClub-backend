const ekg = (sequelize, DataTypes) => {
  const EKG = sequelize.define('ekg', {
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
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 0,
    },
    avgHeartRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      default: 0
    },
    file_url: {
      type: DataTypes.TEXT,
      allowNull: false,
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

  return EKG;
};

export default ekg;