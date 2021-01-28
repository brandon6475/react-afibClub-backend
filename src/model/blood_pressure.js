const bloodPressure = (sequelize, DataTypes) => {
  const BloodPressure = sequelize.define('blood_pressure', {
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
    sys_uuid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    systolic: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    dia_uuid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    diastolic: {
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

  return BloodPressure;
};

export default bloodPressure;