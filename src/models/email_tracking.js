const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class EmailTracking extends Model {}

EmailTracking.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: true,
    readonly: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  verification_token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Default value is false until email is verified
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'EmailTracking',
  tableName: 'EmailTracking',
  timestamps: false,
  hooks: {
    beforeUpdate: async (emailTracking) => {
      emailTracking.timestamp = new Date();
    }
  }
});

module.exports = EmailTracking;