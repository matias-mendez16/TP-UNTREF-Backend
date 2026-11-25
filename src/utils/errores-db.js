export function esErrorDuplicado(error) {
  return error?.name === 'SequelizeUniqueConstraintError'
    || error?.code === 'ER_DUP_ENTRY'
    || error?.original?.code === 'ER_DUP_ENTRY';
}
