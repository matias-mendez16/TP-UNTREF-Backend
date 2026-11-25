import { DataTypes } from 'sequelize';

import { sequelize } from '../config/database.js';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export const Turno = sequelize.define(
  'Turno',
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
    pacienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'usuarios', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    bloqueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'bloques_disponibilidad', key: 'id' },
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
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        is: { args: FORMATO_FECHA, msg: 'fecha debe tener formato YYYY-MM-DD.' },
      },
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
    estado: {
      type: DataTypes.ENUM('reservado', 'cancelado'),
      allowNull: false,
      defaultValue: 'reservado',
    },
    canceladoPorRol: {
      type: DataTypes.ENUM('paciente', 'medico', 'admin'),
      allowNull: true,
    },
    canceladoEn: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    slotActivoKey: {
      type: DataTypes.STRING(120),
      allowNull: true,
      unique: true,
    },
  },
  {
    tableName: 'turnos',
    timestamps: true,
    indexes: [
      {
        name: 'turnos_bloque_medico_lugar_idx',
        fields: ['bloqueId', 'medicoId', 'lugarId'],
      },
    ],
    validate: {
      claveSegunEstado() {
        if (this.estado === 'reservado' && !this.slotActivoKey) {
          throw new Error('Un turno reservado debe tener slotActivoKey.');
        }
        if (this.estado === 'cancelado' && this.slotActivoKey) {
          throw new Error('Un turno cancelado no debe tener slotActivoKey.');
        }
      },
    },
  },
);

Turno.associate = (modelos) => {
  Turno.belongsTo(modelos.Medico, {
    foreignKey: 'medicoId',
    as: 'medico',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  Turno.belongsTo(modelos.Usuario, {
    foreignKey: 'pacienteId',
    as: 'paciente',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  Turno.belongsTo(modelos.BloqueDisponibilidad, {
    foreignKey: 'bloqueId',
    as: 'bloque',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
  Turno.belongsTo(modelos.LugarAtencion, {
    foreignKey: 'lugarId',
    as: 'lugar',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
};
