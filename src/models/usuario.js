import { DataTypes } from 'sequelize';

import { sequelize } from '../config/database.js';

export const Usuario = sequelize.define(
  'Usuario',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: true },
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM('paciente', 'medico', 'admin'),
      allowNull: false,
      defaultValue: 'paciente',
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'usuarios',
    timestamps: true,
  },
);

Usuario.associate = (modelos) => {
  Usuario.hasOne(modelos.Medico, {
    foreignKey: 'usuarioId',
    as: 'perfilMedico',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  Usuario.hasMany(modelos.Turno, {
    foreignKey: 'pacienteId',
    as: 'turnos',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
};
