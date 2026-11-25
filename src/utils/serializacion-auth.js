export function serializarUsuario(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  };
}

export function serializarMedico(usuario, medico) {
  return {
    ...serializarUsuario(usuario),
    medicoId: medico.id,
  };
}

export function serializarSesion(usuario, medicoId) {
  return {
    ...serializarUsuario(usuario),
    medicoId: medicoId ?? null,
  };
}
