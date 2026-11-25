import { sequelize } from '../config/database.js';

import { Usuario } from './usuario.js';
import { Medico } from './medico.js';
import { LugarAtencion } from './lugar-atencion.js';
import { BloqueDisponibilidad } from './bloque-disponibilidad.js';
import { Turno } from './turno.js';

const modelos = {
  sequelize,
  Usuario,
  Medico,
  LugarAtencion,
  BloqueDisponibilidad,
  Turno,
};

for (const modelo of Object.values(modelos)) {
  if (typeof modelo?.associate === 'function') {
    modelo.associate(modelos);
  }
}

export { sequelize, Usuario, Medico, LugarAtencion, BloqueDisponibilidad, Turno };
export default modelos;
