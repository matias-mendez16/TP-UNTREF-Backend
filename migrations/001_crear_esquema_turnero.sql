CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('paciente', 'medico', 'admin') NOT NULL DEFAULT 'paciente',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS medicos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  especialidad VARCHAR(150) NOT NULL,
  matricula VARCHAR(60) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_medicos_usuario_id UNIQUE (usuario_id),
  CONSTRAINT uq_medicos_matricula UNIQUE (matricula),
  CONSTRAINT fk_medicos_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lugares_atencion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medico_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lugares_medico FOREIGN KEY (medico_id)
    REFERENCES medicos (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bloques_disponibilidad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medico_id INT NOT NULL,
  lugar_id INT NOT NULL,
  dia_semana TINYINT UNSIGNED NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_minutos INT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_bloques_id_medico_lugar UNIQUE (id, medico_id, lugar_id),
  CONSTRAINT fk_bloques_medico FOREIGN KEY (medico_id)
    REFERENCES medicos (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_bloques_lugar FOREIGN KEY (lugar_id)
    REFERENCES lugares_atencion (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_bloques_dia_semana CHECK (dia_semana BETWEEN 0 AND 6),
  CONSTRAINT ck_bloques_duracion CHECK (duracion_minutos > 0),
  CONSTRAINT ck_bloques_horario CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medico_id INT NOT NULL,
  paciente_id INT NOT NULL,
  bloque_id INT NOT NULL,
  lugar_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado ENUM('reservado', 'cancelado') NOT NULL DEFAULT 'reservado',
  cancelado_por_rol ENUM('paciente', 'medico', 'admin') NULL,
  cancelado_en DATETIME NULL,
  slot_activo_key VARCHAR(120) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_turnos_slot_activo UNIQUE (slot_activo_key),
  KEY idx_turnos_bloque_medico_lugar (bloque_id, medico_id, lugar_id),
  CONSTRAINT fk_turnos_medico FOREIGN KEY (medico_id)
    REFERENCES medicos (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_turnos_paciente FOREIGN KEY (paciente_id)
    REFERENCES usuarios (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_turnos_bloque FOREIGN KEY (bloque_id)
    REFERENCES bloques_disponibilidad (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_turnos_lugar FOREIGN KEY (lugar_id)
    REFERENCES lugares_atencion (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_turnos_bloque_medico_lugar FOREIGN KEY (bloque_id, medico_id, lugar_id)
    REFERENCES bloques_disponibilidad (id, medico_id, lugar_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_turnos_estado_clave CHECK (
    (estado = 'reservado' AND slot_activo_key IS NOT NULL)
    OR (estado = 'cancelado' AND slot_activo_key IS NULL)
  ),
  CONSTRAINT ck_turnos_metadata_cancelacion CHECK (
    (estado = 'reservado' AND cancelado_por_rol IS NULL AND cancelado_en IS NULL)
    OR (estado = 'cancelado' AND cancelado_por_rol IS NOT NULL AND cancelado_en IS NOT NULL)
  ),
  CONSTRAINT ck_turnos_horario CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
