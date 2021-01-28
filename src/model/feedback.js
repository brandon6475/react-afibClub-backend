const feedback = (sequelize, DataTypes) => {
  const Feedback = sequelize.define('feedback', {
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true
      },
    },
    chat_id: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true
      },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 0,
      validate: {
        isNumeric: true
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
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

  return Feedback;
};

export default feedback;