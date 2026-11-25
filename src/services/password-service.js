import bcrypt from 'bcryptjs';

const RONDAS = 10;

export function hashearPassword(password) {
  return bcrypt.hash(password, RONDAS);
}

export function compararPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
