import { DataTypes } from 'sequelize';

import { sequelize } from '../config/database.js';

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export const BloqueDisponibilidad = sequelize.define(
  'BloqueDisponibilidad',
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
    lugarId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'lugares_atencion', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    diaSemana: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 6 },
    },
    horaInicio: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        is: { args: FORMATO_HORA, msg: 'horaInicio debe tener formato HH:mm.' },
      },
    },
    horaFin: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        is: { args: FORMATO_HORA, msg: 'horaFin debe tener formato HH:mm.' },
      },
    },
    duracionMinutos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'bloques_disponibilidad',
    timestamps: true,
    indexes: [
      {
        name: 'bloques_id_medico_lugar_uniq',
        unique: true,
        fields: ['id', 'medicoId', 'lugarId'],
      },
    ],
  },
);

BloqueDisponibilidad.associate = (modelos) => {
  BloqueDisponibilidad.belongsTo(modelos.Medico, {
    foreignKey: 'medicoId',
    as: 'medico',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  BloqueDisponibilidad.belongsTo(modelos.LugarAtencion, {
    foreignKey: 'lugarId',
    as: 'lugar',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  BloqueDisponibilidad.hasMany(modelos.Turno, {
    foreignKey: 'bloqueId',
    as: 'turnos',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
};
