// ============================================================================
// API SERVICE - Centraliza todas las llamadas a Edge Functions
// ============================================================================

const API_CONFIG = {
  SUPABASE_URL: 'https://slwbzfxwrxrsnlizapps.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_9yQQumW9JF5A-NjFjtp3Og_7HBfSDpr',
};

const normalizeRoleName = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  const roles = {
    superadmin: 'Superadmin',
    directivo: 'Directivo',
    docente: 'Docente',
    control_estudios: 'Control_estudios',
    evaluacion_docente: 'Evaluacion_docente',
    estudiante: 'Estudiante',
    admin: 'Superadmin',
  };
  return roles[normalized] || value || '';
};

const normalizeUser = (user = {}) => {
  const metadata = user?.user_metadata || user?.metadata || {};
  const rawRol = user?.rol_principal || user?.rol || user?.role || metadata?.rol || metadata?.role || '';
  const disabledValue = user?.deshabilitado ?? user?.disabled ?? user?.is_disabled ?? user?.activo === false;

  return {
    ...user,
    id: user?.id || user?.user_id || user?.userId || null,
    user_id: user?.user_id || user?.id || user?.userId || null,
    email: user?.email || metadata?.email || '',
    nombre: user?.nombre || user?.nombres || metadata?.nombre || metadata?.nombres || '',
    apellido: user?.apellido || user?.apellidos || metadata?.apellido || metadata?.apellidos || '',
    cedula: user?.cedula || user?.ci || metadata?.cedula || metadata?.ci || '',
    rol: normalizeRoleName(rawRol),
    rol_principal: normalizeRoleName(rawRol),
    deshabilitado: Boolean(disabledValue),
    activo: user?.activo ?? user?.enabled ?? !Boolean(disabledValue),
  };
};

// ============================================================================
// USUARIOS - User Management
// ============================================================================

const usuariosAPI = {
  /**
   * Crear nuevo usuario
   * POST /functions/v1/modulo-usuarios
   */
  crear: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-usuarios',
      {
        method: 'POST',
        body: {
          action: 'create_user',
          data: {
            email,
            password,
            id_rol: metadata.id_rol || metadata.rol || 'docente',
            username: metadata.username || metadata.email?.split('@')[0] || email.split('@')[0],
            nombres: metadata.nombre || metadata.nombres || '',
            apellidos: metadata.apellido || metadata.apellidos || '',
            cedula: metadata.cedula || metadata.ci || '',
            especialidad: metadata.especialidad || null,
            cargo: metadata.cargo || null,
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Listar usuarios
   * POST /functions/v1/modulo-usuarios
   */
  listar: async (filters = {}) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-usuarios',
      {
        method: 'POST',
        body: {
          action: 'list_users',
          data: filters,
        },
      }
    );
    if (error) throw error;

    if (Array.isArray(data)) return data.map(normalizeUser);
    if (data && typeof data === 'object') {
      const payload = data.data || data.registros || data.users || data.items || [];
      if (Array.isArray(payload)) return payload.map(normalizeUser);
      return [normalizeUser(data)];
    }

    return [];
  },

  /**
   * Obtener usuario por ID
   */
  obtener: async (userId) => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*, user_roles(id_rol)')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return normalizeUser(data);
  },

  /**
   * Actualizar usuario
   * POST /functions/v1/modulo-usuarios
   */
  actualizar: async (userId, updates) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-usuarios',
      {
        method: 'POST',
        body: {
          action: 'update_user',
          data: {
            target_user_id: userId,
            ...updates,
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Habilitar usuario
   * POST /functions/v1/modulo-usuarios
   */
  habilitar: async (userId) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-usuarios',
      {
        method: 'POST',
        body: {
          action: 'toggle_status',
          data: {
            target_user_id: userId,
            status: 'enable',
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Deshabilitar usuario
   * POST /functions/v1/modulo-usuarios
   */
  deshabilitar: async (userId) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-usuarios',
      {
        method: 'POST',
        body: {
          action: 'toggle_status',
          data: {
            target_user_id: userId,
            status: 'disable',
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Cambiar email
   * POST /functions/v1/modulo-usuarios
   */
  cambiarEmail: async (userId, nuevoEmail) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-usuarios',
      {
        method: 'POST',
        body: {
          action: 'update_user',
          data: {
            target_user_id: userId,
            email: nuevoEmail,
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Resetear contraseña
   * POST /functions/v1/modulo-usuarios
   */
  resetearPassword: async (userId, newPassword) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-usuarios',
      {
        method: 'POST',
        body: {
          action: 'reset_password',
          data: {
            target_user_id: userId,
            new_password: newPassword,
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Consultar registros de auditoría (solo Superadmin)
   * POST /functions/v1/modulo-usuarios
   */
  consultarAuditoria: async (filters = {}) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-usuarios',
      {
        method: 'POST',
        body: {
          action: 'consultar-auditoria',
          data: filters,
        },
      }
    );
    if (error) throw error;
    return data;
  },
};

// ============================================================================
// PERÍODOS ACADÉMICOS - Academic Periods
// ============================================================================

const periodosAPI = {
  /**
   * Listar años escolares
   */
  listarAnios: async () => {
    const { data, error } = await supabase
      .from('anios_escolares')
      .select('*')
      .order('id_anio', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Crear año escolar
   * POST /functions/v1/modulo-periodos
   */
  crearAnio: async (nombre, fechaInicio, fechaFin) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-periodos',
      {
        method: 'POST',
        body: {
          action: 'crear_anio',
          params: {
            nombre,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Listar lapsos de un año
   * POST /functions/v1/modulo-periodos
   */
  listarLapsos: async (anioId) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-periodos',
      {
        method: 'POST',
        body: {
          action: 'listar_lapsos',
          params: { id_anio: anioId },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Crear lapso
   * POST /functions/v1/modulo-periodos
   */
  crearLapso: async (anioId, numero, fechaInicio, fechaFin) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-periodos',
      {
        method: 'POST',
        body: {
          action: 'crear_lapso',
          params: {
            id_anio: anioId,
            nombre: numero,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Activar lapso
   * POST /functions/v1/modulo-periodos
   */
  activarLapso: async (lapsoId) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-periodos',
      {
        method: 'POST',
        body: {
          action: 'activar_lapso',
          params: { id_lapso: lapsoId },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Cerrar lapso
   * POST /functions/v1/modulo-periodos
   */
  cerrarLapso: async (lapsoId) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-periodos',
      {
        method: 'POST',
        body: {
          action: 'cerrar_lapso',
          params: { id_lapso: lapsoId },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Cerrar año escolar
   * POST /functions/v1/modulo-periodos
   */
  cerrarAnio: async (anioId) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-periodos',
      {
        method: 'POST',
        body: {
          action: 'cerrar_anio',
          params: { id_anio: anioId },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Obtener período académico activo
   * POST /functions/v1/modulo-periodos
   */
  obtenerActivo: async () => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-periodos',
      {
        method: 'POST',
        body: { action: 'obtener_activo', params: {} },
      }
    );
    if (error) throw error;
    return data;
  },
};

// ============================================================================
// SECCIONES - Sections/Grades
// ============================================================================

const seccionesAPI = {
  /**
   * Listar secciones
   * POST /functions/v1/modulo-secciones
   */
  listar: async (filters = {}) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-secciones',
      {
        method: 'POST',
        body: {
          action: 'listar',
          data: filters,
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Crear sección
   * POST /functions/v1/modulo-secciones
   */
  crear: async (seccionData) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-secciones',
      {
        method: 'POST',
        body: {
          action: 'crear',
          data: seccionData,
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Editar sección
   * POST /functions/v1/modulo-secciones
   */
  editar: async (seccionId, updates) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-secciones',
      {
        method: 'POST',
        body: {
          action: 'editar',
          data: {
            id_seccion: seccionId,
            ...updates,
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Asignar docente a materia en sección
   * POST /functions/v1/modulo-materias
   */
  asignarDocente: async (seccionId, materiaId, docenteId) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-materias',
      {
        method: 'POST',
        body: {
          action: 'asignar-docente',
          p_id_seccion: seccionId,
          p_id_materia: materiaId,
          p_id_docente: docenteId,
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Cambiar docente de una materia
   * POST /functions/v1/modulo-materias
   */
  cambiarDocente: async (seccionId, materiaId, nuevoDocenteId) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-materias',
      {
        method: 'POST',
        body: {
          action: 'cambiar-docente',
          p_id_seccion: seccionId,
          p_id_materia: materiaId,
          p_id_docente: nuevoDocenteId,
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Listar materias de una sección
   * POST /functions/v1/modulo-materias
   */
  listarMaterias: async (seccionId) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-materias',
      {
        method: 'POST',
        body: {
          action: 'listar-materias-seccion',
          p_id_seccion: seccionId,
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Agregar materia a sección
   * POST /functions/v1/modulo-materias
   */
  agregarMateria: async (seccionId, materiaId) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-materias',
      {
        method: 'POST',
        body: {
          action: 'agregar-materia-seccion',
          p_id_seccion: seccionId,
          p_id_materia: materiaId,
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Quitar materia de sección
   * POST /functions/v1/modulo-materias
   */
  quitarMateria: async (seccionId, materiaId) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-materias',
      {
        method: 'POST',
        body: {
          action: 'quitar-materia-seccion',
          p_id_seccion: seccionId,
          p_id_materia: materiaId,
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Clonar sección
   * POST /functions/v1/modulo-secciones
   */
  clonar: async (seccionId, nombreNuevo, letraNuevo) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-secciones',
      {
        method: 'POST',
        body: {
          action: 'clonar',
          data: {
            p_id_seccion_origen: seccionId,
            p_nombre_nuevo: nombreNuevo,
            p_letra_nueva: letraNuevo,
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Toggle sección (activa/inactiva)
   * POST /functions/v1/modulo-secciones
   */
  toggle: async (seccionId) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-secciones',
      {
        method: 'POST',
        body: {
          action: 'toggle_status',
          data: { id_seccion: seccionId },
        },
      }
    );
    if (error) throw error;
    return data;
  },
};

// ============================================================================
// ESTUDIANTES - Students
// ============================================================================

const estudiantesAPI = {
  /**
   * Listar estudiantes
   * POST /functions/v1/modulo-estudiantes
   */
  listar: async (filters = {}) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-estudiantes',
      {
        method: 'POST',
        body: {
          action: 'listar',
          data: filters,
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Inscribir estudiante
   * POST /functions/v1/modulo-estudiantes
   */
  inscribir: async (estudianteData) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-estudiantes',
      {
        method: 'POST',
        body: {
          action: 'inscribir',
          data: estudianteData,
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Cambiar estudiante de sección
   */
  cambiarSeccion: async (id_inscripcion, nuevaSeccionId) => {
    const { data: inscripcion, error: insError } = await supabase
      .from('inscripciones')
      .select('estudiante_id, anio_escolar_id')
      .eq('id_inscripcion', id_inscripcion)
      .single();

    if (insError) throw insError;

    const { data, error } = await supabase.functions.invoke(
      'modulo-estudiantes',
      {
        method: 'POST',
        body: {
          action: 'cambiar_seccion',
          data: {
            estudiante_id: inscripcion.estudiante_id,
            anio_escolar_id: inscripcion.anio_escolar_id,
            seccion_id: nuevaSeccionId,
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Promover estudiante
   */
  promover: async (id_inscripcion, destinoSeccionId) => {
    const { data: inscripcion, error: insError } = await supabase
      .from('inscripciones')
      .select('estudiante_id, anio_escolar_id')
      .eq('id_inscripcion', id_inscripcion)
      .single();

    if (insError) throw insError;

    const { data: destino, error: destError } = await supabase
      .from('secciones')
      .select('anio_escolar_id')
      .eq('id_seccion', destinoSeccionId)
      .single();

    if (destError) throw destError;

    const { data, error } = await supabase.functions.invoke(
      'modulo-estudiantes',
      {
        method: 'POST',
        body: {
          action: 'promover',
          data: {
            estudiante_id: inscripcion.estudiante_id,
            anio_origen_id: inscripcion.anio_escolar_id,
            seccion_destino_id: destinoSeccionId,
            anio_destino_id: destino.anio_escolar_id,
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Repetir grado (estudiante)
   */
  repetir: async (id_inscripcion, destinoSeccionId) => {
    const { data: inscripcion, error: insError } = await supabase
      .from('inscripciones')
      .select('estudiante_id, anio_escolar_id')
      .eq('id_inscripcion', id_inscripcion)
      .single();

    if (insError) throw insError;

    const { data: destino, error: destError } = await supabase
      .from('secciones')
      .select('anio_escolar_id')
      .eq('id_seccion', destinoSeccionId)
      .single();

    if (destError) throw destError;

    const { data, error } = await supabase.functions.invoke(
      'modulo-estudiantes',
      {
        method: 'POST',
        body: {
          action: 'repetir',
          data: {
            estudiante_id: inscripcion.estudiante_id,
            anio_origen_id: inscripcion.anio_escolar_id,
            seccion_destino_id: destinoSeccionId,
            anio_destino_id: destino.anio_escolar_id,
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /**
   * Retirar estudiante
   */
  retirar: async (id_inscripcion) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-estudiantes',
      {
        method: 'POST',
        body: {
          action: 'retirar',
          data: { id_inscripcion },
        },
      }
    );
    if (error) throw error;
    return data;
  },
};

// ============================================================================
// EVALUACIONES - Evaluation planning and grading
// ============================================================================

const normalizeEvaluaciones = (items = []) => (items || []).map((item) => {
  const normalizedId = item.id_evaluacion ?? item.id ?? item.id_evaluacion ?? null;
  return {
    ...item,
    id: normalizedId,
    nombre_evaluacion: item.nombre_evaluacion || item.nombre || '',
    tipo_evaluacion_id: item.tipo_evaluacion_id ?? item.tecnica ?? null,
    instrumento_id: item.instrumento_id ?? item.instrumento ?? null,
    porcentaje: item.porcentaje ?? null,
    valor_maximo: item.valor_maximo ?? null,
    tipos_evaluacion: item.tipos_evaluacion || (item.tecnica ? { nombre: item.tecnica } : null),
    instrumentos_evaluacion: item.instrumentos_evaluacion || (item.instrumento ? { nombre: item.instrumento } : null),
  };
});

const evaluacionesAPI = {
  listar: async (filters = {}) => {
    const { docente_id = null, seccion_id = null, materia_id = null, lapso_id = null } = filters;

    let query = supabase
      .from('evaluaciones')
      .select(`
        id,
        id_evaluacion,
        nombre_evaluacion,
        tipo_evaluacion_id,
        instrumento_id,
        fecha,
        valor_maximo,
        porcentaje,
        descripcion,
        tipos_evaluacion (nombre),
        instrumentos_evaluacion (nombre)
      `)
      .order('fecha', { ascending: true });

    if (docente_id) query = query.eq('docente_id', docente_id);
    if (seccion_id) query = query.eq('seccion_id', seccion_id);
    if (materia_id) query = query.eq('materia_id', materia_id);
    if (lapso_id) query = query.eq('lapso_id', lapso_id);

    const { data, error } = await query;
    if (!error && data) return normalizeEvaluaciones(data);

    let fallbackQuery = supabase
      .from('evaluaciones_lapsos')
      .select(`
        id_evaluacion,
        nombre,
        tecnica,
        instrumento,
        fecha,
        valor_maximo,
        porcentaje,
        descripcion,
        lapso_id,
        materia_id,
        seccion_id,
        docente_id
      `)
      .order('fecha', { ascending: true });

    if (docente_id) fallbackQuery = fallbackQuery.eq('docente_id', docente_id);
    if (seccion_id) fallbackQuery = fallbackQuery.eq('seccion_id', seccion_id);
    if (materia_id) fallbackQuery = fallbackQuery.eq('materia_id', materia_id);
    if (lapso_id) fallbackQuery = fallbackQuery.eq('lapso_id', lapso_id);

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;
    if (fallbackError) throw fallbackError;
    return normalizeEvaluaciones(fallbackData || []);
  },

  crear: async (payload) => {
    const input = payload || {};
    const evaluations = Array.isArray(input?.data?.evaluaciones)
      ? input.data.evaluaciones.map(({ action: _action, ...item }) => item)
      : [{ ...input }];

    const requestBody = {
      action: 'configurar-planilla',
      data: {
        evaluaciones,
        docente_id: input.docente_id,
        seccion_id: input.seccion_id,
        materia_id: input.materia_id,
        lapso_id: input.lapso_id,
      },
    };

    const { data, error } = await supabase.functions.invoke(
      'modulo-notas',
      {
        method: 'POST',
        body: requestBody,
      }
    );
    if (error) throw error;
    return data;
  },

  guardarNotas: async (evaluacionId, notas) => {
    const { data, error } = await supabase.functions.invoke(
      'modulo-notas',
      {
        method: 'POST',
        body: {
          action: 'registrar-planilla',
          data: {
            evaluacion_id: evaluacionId,
            notas,
          },
        },
      }
    );
    if (error) throw error;
    return data;
  },

  obtenerPorId: async (evaluacionId) => {
    const { data, error } = await supabase
      .from('evaluaciones')
      .select(`
        id,
        id_evaluacion,
        nombre_evaluacion,
        tipo_evaluacion_id,
        instrumento_id,
        fecha,
        valor_maximo,
        porcentaje,
        descripcion,
        tipos_evaluacion (nombre),
        instrumentos_evaluacion (nombre)
      `)
      .eq('id', evaluacionId)
      .single();

    if (!error && data) return normalizeEvaluaciones([data])[0];

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('evaluaciones_lapsos')
      .select(`
        id_evaluacion,
        nombre,
        tecnica,
        instrumento,
        fecha,
        valor_maximo,
        porcentaje,
        descripcion
      `)
      .eq('id_evaluacion', evaluacionId)
      .single();

    if (fallbackError) throw fallbackError;
    return fallbackData ? normalizeEvaluaciones([fallbackData])[0] : null;
  },
};

// ============================================================================
// EXPORTAR TODOS LOS SERVICIOS
// ============================================================================

const API = {
  usuarios: usuariosAPI,
  periodos: periodosAPI,
  secciones: seccionesAPI,
  estudiantes: estudiantesAPI,
  evaluaciones: evaluacionesAPI,
};

window.API = API;
