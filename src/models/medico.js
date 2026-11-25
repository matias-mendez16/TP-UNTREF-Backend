import { DataTypes } from 'sequelize';

import { sequelize } from '../config/database.js';

export const Medico = sequelize.define(
  'Medico',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'usuarios', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    especialidad: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: true },
    },
    matricula: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true },
    },
  },
  {
    tableName: 'medicos',
    timestamps: true,
  },
);

Medico.associate = (modelos) => {
  Medico.belongsTo(modelos.Usuario, {
    foreignKey: 'usuarioId',
    as: 'usuario',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  Medico.hasMany(modelos.LugarAtencion, {
    foreignKey: 'medicoId',
    as: 'lugaresAtencion',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  Medico.hasMany(modelos.BloqueDisponibilidad, {
    foreignKey: 'medicoId',
    as: 'bloquesDisponibilidad',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  Medico.hasMany(modelos.Turno, {
    foreignKey: 'medicoId',
    as: 'turnos',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
};
