import { DataTypes } from 'sequelize';

import { sequelize } from '../config/database.js';

export const LugarAtencion = sequelize.define(
  'LugarAtencion',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    medicoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'medicos', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: true },
    },
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true },
    },
  },
  {
    tableName: 'lugares_atencion',
    timestamps: true,
  },
);

LugarAtencion.associate = (modelos) => {
  LugarAtencion.belongsTo(modelos.Medico, {
    foreignKey: 'medicoId',
    as: 'medico',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  LugarAtencion.hasMany(modelos.BloqueDisponibilidad, {
    foreignKey: 'lugarId',
    as: 'bloquesDisponibilidad',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  LugarAtencion.hasMany(modelos.Turno, {
    foreignKey: 'lugarId',
    as: 'turnos',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
};
