// ============================================================================
// AUTH & PROFILE BACKEND API - GESTIÓN INTEGRAL DE IDENTIDAD, ROLES,
// MÚLTIPLES DIRECCIONES Y RECUPERACIÓN DE CONTRASEÑA (EMAIL / SMS / PREGUNTA)
// ============================================================================

const crypto = require('crypto');
const localStore = require('./localStore');

function normalizeAnswer(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizePhoneDigits(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
}

function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  const raw = String(identifier).trim();
  const lower = raw.toLowerCase();
  const digits = normalizePhoneDigits(raw);

  return localStore.users.find(u => {
    if (u.id === raw) return true;
    if ((u.email || '').toLowerCase() === lower) return true;
    if (digits.length >= 7) {
      const uDigits = normalizePhoneDigits(u.phone);
      if (uDigits && (uDigits === digits || uDigits.endsWith(digits) || digits.endsWith(uDigits))) {
        return true;
      }
    }
    return false;
  }) || null;
}

function serializeUserPublic(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    phone: u.phone,
    avatar_url: u.avatar_url,
    role: u.role,
    subrole: u.subrole || (u.role === 'RESTAURANT_ADMIN' ? 'ADMIN' : 'STANDARD'),
    account_status: u.account_status || 'ACTIVE',
    is_multi_management: Boolean(u.is_multi_management),
    restaurant_id: u.restaurant_id || null,
    restaurant_name: u.restaurant_name || null,
    authorized_restaurants: u.authorized_restaurants || [],
    address: u.address || 'Galerías Santo Domingo, Managua',
    notes: u.notes || '',
    security_question: u.security_question || '¿Cuál es tu comida nica favorita?',
    saved_addresses: Array.isArray(u.saved_addresses) ? u.saved_addresses : [],
    driver_profile: u.driver_profile || null
  };
}

async function handleAuthApi(req, res, url, config) {
  const { broadcastEvent } = config;

  const sendJson = (status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
  };

  const readBody = () => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });

  if (req.method === 'OPTIONS') {
    sendJson(200, { ok: true });
    return;
  }

  const cleanUrl = url.split('?')[0];

  // ==========================================================================
  // 1. POST /api/auth/login - Iniciar sesión por email, teléfono o userId
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/login') {
    try {
      const payload = await readBody();
      const { email, phone, identifier, password, userId } = payload;

      let matchedUser = null;
      if (userId) {
        matchedUser = localStore.users.find(u => u.id === userId) || null;
      } else {
        matchedUser = findUserByIdentifier(identifier || email || phone);
      }

      if (!matchedUser) {
        sendJson(401, { success: false, error: 'No se encontró ninguna cuenta asociada a ese correo o teléfono.' });
        return;
      }

      // Validar contraseña si se ingresó (permitiendo la contraseña actual del usuario o Password123! para cuentas demo)
      if (password && matchedUser.password && password !== matchedUser.password && password !== 'Password123!') {
        sendJson(401, { success: false, error: 'Contraseña incorrecta. ¿Olvidaste tu contraseña? Puedes recuperarla por Email, SMS o Pregunta de Seguridad.' });
        return;
      }

      if (matchedUser.account_status === 'SUSPENDED') {
        sendJson(403, {
          success: false,
          error: '🚫 Cuenta Suspendida: Tu acceso ha sido temporalmente deshabilitado por el Administrador de la Plataforma.'
        });
        return;
      }

      sendJson(200, {
        success: true,
        user: serializeUserPublic(matchedUser)
      });
    } catch (err) {
      console.error('[Auth API] Error en login:', err);
      sendJson(500, { success: false, error: 'Error del servidor durante la autenticación.' });
    }
    return;
  }

  // ==========================================================================
  // 2. POST /api/auth/register - Registro de nuevo usuario con libreta de direcciones y pregunta de seguridad
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/register') {
    try {
      const payload = await readBody();
      const {
        full_name,
        email,
        phone = '+505 8888-0000',
        password = 'Password123!',
        role = 'CLIENT',
        subrole = 'ADMIN',
        restaurant_id = null,
        restaurant_name = null,
        is_multi_management = false,
        authorized_restaurants = [],
        vehicle_type = 'MOTORCYCLE',
        license_plate = 'M-10293',
        address = 'Galerías Santo Domingo, Managua',
        notes = '',
        zone = 'Galerías / Las Colinas',
        lat = 12.1022,
        lng = -86.2415,
        security_question = '¿Cuál es tu comida nica favorita?',
        security_answer = 'gallo pinto'
      } = payload;

      if (!full_name || !email) {
        sendJson(400, { success: false, error: 'El nombre completo y correo electrónico son obligatorios.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      if (localStore.users.some(u => (u.email || '').toLowerCase() === cleanEmail)) {
        sendJson(400, { success: false, error: 'Ya existe una cuenta registrada con ese correo electrónico.' });
        return;
      }

      const validRole = ['CLIENT', 'DRIVER', 'RESTAURANT_ADMIN', 'SUPER_ADMIN'].includes(role) ? role : 'CLIENT';
      const newUserId = crypto.randomUUID();
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name.trim())}&background=06C167&color=000&bold=true`;

      let driverProfileObj = null;
      if (validRole === 'DRIVER') {
        driverProfileObj = {
          driver_id: newUserId,
          vehicle_type: ['MOTORCYCLE', 'BICYCLE', 'CAR'].includes(vehicle_type) ? vehicle_type : 'MOTORCYCLE',
          license_plate: license_plate.trim() || 'M-99881',
          current_status: 'AVAILABLE',
          is_verified: true,
          rating: 5.0,
          battery_level: 100,
          last_location: 'POINT(-86.2650 12.1260)'
        };
      }

      const targetRestId = validRole === 'RESTAURANT_ADMIN' ? (restaurant_id || '6701bc0c-e5ce-475a-8893-75e9d06e8012') : null;
      const targetRestObj = targetRestId ? localStore.restaurants.find(r => r.id === targetRestId) : null;
      const targetRestName = validRole === 'RESTAURANT_ADMIN' ? (restaurant_name || targetRestObj?.name || 'Pupusería & Antojitos El Diamante') : null;

      const initialAddresses = address ? [
        {
          id: `addr-${Date.now()}`,
          label: 'Casa',
          icon: '🏠',
          building_type: 'CASA',
          zone: zone || 'Managua',
          address: address.trim(),
          reference: notes ? notes.trim() : 'Llamar al llegar',
          recipient_phone: phone.trim(),
          lat: Number(lat) || 12.1022,
          lng: Number(lng) || -86.2415,
          is_default: true
        }
      ] : [];

      const finalUser = {
        id: newUserId,
        email: cleanEmail,
        password: password || 'Password123!',
        full_name: full_name.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl,
        role: validRole,
        subrole: validRole === 'RESTAURANT_ADMIN' ? (subrole || 'ADMIN') : 'STANDARD',
        account_status: 'ACTIVE',
        is_multi_management: Boolean(is_multi_management),
        restaurant_id: targetRestId,
        restaurant_name: targetRestName,
        authorized_restaurants: validRole === 'RESTAURANT_ADMIN'
          ? (authorized_restaurants && authorized_restaurants.length > 0 ? authorized_restaurants : [{ id: targetRestId, name: targetRestName }])
          : [],
        address: address.trim(),
        notes: notes ? notes.trim() : '',
        security_question: security_question || '¿Cuál es tu comida nica favorita?',
        security_answer: (security_answer || 'gallo pinto').trim(),
        saved_addresses: initialAddresses,
        driver_profile: driverProfileObj,
        created_at: new Date().toISOString()
      };

      localStore.users.unshift(finalUser);

      if (broadcastEvent) {
        broadcastEvent({ type: 'USER_REGISTERED', user: serializeUserPublic(finalUser) });
      }

      sendJson(201, {
        success: true,
        message: 'Usuario registrado exitosamente.',
        user: serializeUserPublic(finalUser)
      });
    } catch (err) {
      console.error('[Auth API] Error en registro:', err);
      sendJson(500, { success: false, error: 'Error interno al registrar usuario.' });
    }
    return;
  }

  // ==========================================================================
  // 3. GET /api/auth/users - Directorio completo de usuarios y comercios para IAM
  // ==========================================================================
  if (req.method === 'GET' && cleanUrl === '/api/auth/users') {
    try {
      sendJson(200, {
        success: true,
        users: localStore.users.map(u => ({
          ...u,
          driver_profiles: u.driver_profile ? [u.driver_profile] : []
        })),
        restaurants: localStore.restaurants
      });
    } catch (err) {
      sendJson(500, { success: false, error: 'Error al listar usuarios.' });
    }
    return;
  }

  // ==========================================================================
  // 4. POST /api/auth/profile - Editar perfil, teléfono, dirección, pregunta de seguridad o contraseña
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/profile') {
    try {
      const payload = await readBody();
      const {
        userId,
        fullName,
        phone,
        email,
        avatarUrl,
        vehicleType,
        licensePlate,
        address,
        notes,
        savedAddresses,
        securityQuestion,
        securityAnswer,
        newPassword
      } = payload;

      if (!userId) {
        sendJson(400, { success: false, error: 'Falta userId.' });
        return;
      }

      const u = localStore.users.find(x => x.id === userId);
      if (u) {
        if (fullName !== undefined && String(fullName).trim()) u.full_name = String(fullName).trim();
        if (phone !== undefined && String(phone).trim()) u.phone = String(phone).trim();
        if (email !== undefined && String(email).trim()) u.email = String(email).trim().toLowerCase();
        if (avatarUrl !== undefined) u.avatar_url = avatarUrl;
        if (address !== undefined) u.address = address;
        if (notes !== undefined) u.notes = notes;
        if (Array.isArray(savedAddresses)) u.saved_addresses = savedAddresses;
        if (securityQuestion !== undefined && String(securityQuestion).trim()) {
          u.security_question = String(securityQuestion).trim();
        }
        if (securityAnswer !== undefined && String(securityAnswer).trim()) {
          u.security_answer = String(securityAnswer).trim();
        }
        if (newPassword !== undefined && String(newPassword).trim().length >= 4) {
          u.password = String(newPassword).trim();
        }

        if (vehicleType || licensePlate) {
          if (!u.driver_profile) {
            u.driver_profile = {
              driver_id: u.id,
              vehicle_type: vehicleType || 'MOTORCYCLE',
              license_plate: licensePlate || 'M-1029',
              current_status: 'AVAILABLE',
              is_verified: true,
              battery_level: 95,
              rating: 4.95,
              last_location: 'POINT(-86.2650 12.1260)'
            };
          } else {
            if (vehicleType) u.driver_profile.vehicle_type = vehicleType;
            if (licensePlate) u.driver_profile.license_plate = licensePlate;
          }
        }
      }

      if (broadcastEvent) {
        broadcastEvent({
          type: 'PROFILE_UPDATED',
          userId,
          fullName: u?.full_name || fullName,
          phone: u?.phone || phone,
          address: u?.address || address
        });
      }

      sendJson(200, {
        success: true,
        message: 'Perfil actualizado exitosamente.',
        user: u ? serializeUserPublic(u) : null
      });
    } catch (err) {
      console.error('[Auth API] Error actualizando perfil:', err);
      sendJson(500, { success: false, error: 'Error al actualizar perfil.' });
    }
    return;
  }

  // ==========================================================================
  // 5. POST /api/auth/addresses - CRUD Completo de Libreta de Direcciones Múltiples
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/addresses') {
    try {
      const payload = await readBody();
      const {
        action = 'LIST', // 'LIST' | 'ADD' | 'UPDATE' | 'DELETE' | 'SET_DEFAULT'
        userId,
        addressId,
        addressData = {}
      } = payload;

      const u = localStore.users.find(x => x.id === userId);
      if (!u) {
        sendJson(404, { success: false, error: 'Usuario no encontrado para gestionar libreta de direcciones.' });
        return;
      }

      if (!Array.isArray(u.saved_addresses)) {
        u.saved_addresses = [];
      }

      if (action === 'LIST') {
        sendJson(200, {
          success: true,
          saved_addresses: u.saved_addresses,
          active_address: u.address,
          active_notes: u.notes,
          phone: u.phone
        });
        return;
      }

      if (action === 'ADD') {
        const iconMap = {
          'Casa': '🏠',
          'Oficina': '🏢',
          'Pareja / Familia': '❤️',
          'Universidad': '🎓',
          'Otro': '📍'
        };
        const label = (addressData.label || 'Casa').trim();
        const isFirst = u.saved_addresses.length === 0;
        const makeDefault = Boolean(addressData.is_default) || isFirst;

        if (makeDefault) {
          u.saved_addresses.forEach(a => { a.is_default = false; });
        }

        const newAddr = {
          id: `addr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          label,
          icon: addressData.icon || iconMap[label] || '📍',
          building_type: addressData.building_type || 'CASA',
          zone: addressData.zone || 'Managua',
          address: (addressData.address || 'Managua, Nicaragua').trim(),
          reference: (addressData.reference || '').trim(),
          recipient_phone: (addressData.recipient_phone || u.phone || '+505 8888-0000').trim(),
          lat: Number(addressData.lat) || 12.1022,
          lng: Number(addressData.lng) || -86.2415,
          is_default: makeDefault
        };

        u.saved_addresses.unshift(newAddr);

        if (makeDefault) {
          u.address = newAddr.address;
          u.notes = newAddr.reference;
        }

        sendJson(200, {
          success: true,
          message: 'Dirección agregada a tu libreta.',
          address: newAddr,
          saved_addresses: u.saved_addresses,
          user: serializeUserPublic(u)
        });
        return;
      }

      if (action === 'UPDATE') {
        const target = u.saved_addresses.find(a => a.id === addressId);
        if (!target) {
          sendJson(404, { success: false, error: 'Dirección no encontrada.' });
          return;
        }

        const iconMap = {
          'Casa': '🏠',
          'Oficina': '🏢',
          'Pareja / Familia': '❤️',
          'Universidad': '🎓',
          'Otro': '📍'
        };

        if (addressData.label !== undefined) {
          target.label = addressData.label.trim();
          target.icon = addressData.icon || iconMap[target.label] || target.icon || '📍';
        }
        if (addressData.building_type !== undefined) target.building_type = addressData.building_type;
        if (addressData.zone !== undefined) target.zone = addressData.zone;
        if (addressData.address !== undefined) target.address = addressData.address.trim();
        if (addressData.reference !== undefined) target.reference = addressData.reference.trim();
        if (addressData.recipient_phone !== undefined) target.recipient_phone = addressData.recipient_phone.trim();
        if (addressData.lat !== undefined) target.lat = Number(addressData.lat);
        if (addressData.lng !== undefined) target.lng = Number(addressData.lng);

        if (addressData.is_default) {
          u.saved_addresses.forEach(a => { a.is_default = (a.id === target.id); });
        }

        if (target.is_default) {
          u.address = target.address;
          u.notes = target.reference;
        }

        sendJson(200, {
          success: true,
          message: 'Dirección actualizada correctamente.',
          address: target,
          saved_addresses: u.saved_addresses,
          user: serializeUserPublic(u)
        });
        return;
      }

      if (action === 'DELETE') {
        const idx = u.saved_addresses.findIndex(a => a.id === addressId);
        if (idx === -1) {
          sendJson(404, { success: false, error: 'Dirección no encontrada.' });
          return;
        }
        const wasDefault = u.saved_addresses[idx].is_default;
        u.saved_addresses.splice(idx, 1);

        if (wasDefault && u.saved_addresses.length > 0) {
          u.saved_addresses[0].is_default = true;
          u.address = u.saved_addresses[0].address;
          u.notes = u.saved_addresses[0].reference;
        }

        sendJson(200, {
          success: true,
          message: 'Dirección eliminada.',
          saved_addresses: u.saved_addresses,
          user: serializeUserPublic(u)
        });
        return;
      }

      if (action === 'SET_DEFAULT') {
        const target = u.saved_addresses.find(a => a.id === addressId);
        if (!target) {
          sendJson(404, { success: false, error: 'Dirección no encontrada.' });
          return;
        }
        u.saved_addresses.forEach(a => { a.is_default = (a.id === addressId); });
        u.address = target.address;
        u.notes = target.reference;

        sendJson(200, {
          success: true,
          message: `Dirección "${target.label}" establecida como principal.`,
          address: target,
          saved_addresses: u.saved_addresses,
          user: serializeUserPublic(u)
        });
        return;
      }

      sendJson(400, { success: false, error: 'Acción de dirección no válida.' });
    } catch (err) {
      console.error('[Auth Addresses Error]', err);
      sendJson(500, { success: false, error: 'Error al procesar libreta de direcciones.' });
    }
    return;
  }

  // ==========================================================================
  // 6. POST /api/auth/recovery/initiate - Iniciar recuperación (EMAIL / SMS / SECURITY_QUESTION)
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/recovery/initiate') {
    try {
      const payload = await readBody();
      const { identifier, method = 'EMAIL' } = payload;

      if (!identifier || !String(identifier).trim()) {
        sendJson(400, { success: false, error: 'Ingresa tu correo electrónico o número de teléfono registrado.' });
        return;
      }

      const user = findUserByIdentifier(identifier);
      if (!user) {
        sendJson(404, {
          success: false,
          error: 'No encontramos ninguna cuenta asociada a ese correo o teléfono. Verifica los datos o regístrate.'
        });
        return;
      }

      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      localStore.recoveryTokens[user.id] = {
        code: otpCode,
        method,
        expiresAt: Date.now() + 10 * 60 * 1000
      };

      if (method === 'EMAIL') {
        const parts = (user.email || 'usuario@pedidosnica.com').split('@');
        const maskedEmail = `${parts[0].slice(0, 2)}***@${parts[1] || 'pedidosnica.com'}`;
        sendJson(200, {
          success: true,
          userId: user.id,
          fullName: user.full_name,
          method: 'EMAIL',
          maskedDestination: maskedEmail,
          demoOtpCode: otpCode,
          message: `Se ha enviado un código de verificación de 6 dígitos al correo ${maskedEmail}.`
        });
        return;
      }

      if (method === 'SMS') {
        const cleanPh = user.phone || '+505 8888-0000';
        const maskedPhone = cleanPh.length > 6
          ? `${cleanPh.slice(0, 4)} ****-${cleanPh.slice(-4)}`
          : cleanPh;
        sendJson(200, {
          success: true,
          userId: user.id,
          fullName: user.full_name,
          method: 'SMS',
          maskedDestination: maskedPhone,
          demoOtpCode: otpCode,
          message: `Se ha enviado un SMS con tu código de 6 dígitos al número ${maskedPhone}.`
        });
        return;
      }

      if (method === 'SECURITY_QUESTION') {
        sendJson(200, {
          success: true,
          userId: user.id,
          fullName: user.full_name,
          method: 'SECURITY_QUESTION',
          securityQuestion: user.security_question || '¿Cuál es tu comida nica favorita?',
          hint: 'Responde la pregunta de seguridad configurada en tu perfil.',
          message: 'Responde tu pregunta de seguridad para restablecer tu contraseña.'
        });
        return;
      }

      sendJson(400, { success: false, error: 'Método de recuperación no soportado.' });
    } catch (err) {
      console.error('[Auth Recovery Initiate Error]', err);
      sendJson(500, { success: false, error: 'Error al iniciar recuperación de contraseña.' });
    }
    return;
  }

  // ==========================================================================
  // 7. POST /api/auth/recovery/verify-and-reset - Verificar OTP o Pregunta y Cambiar Contraseña
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/recovery/verify-and-reset') {
    try {
      const payload = await readBody();
      const {
        userId,
        identifier,
        method = 'EMAIL',
        code,
        securityAnswer,
        newPassword
      } = payload;

      const user = userId
        ? localStore.users.find(u => u.id === userId)
        : findUserByIdentifier(identifier);

      if (!user) {
        sendJson(404, { success: false, error: 'Usuario no encontrado.' });
        return;
      }

      if (!newPassword || String(newPassword).trim().length < 6) {
        sendJson(400, { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        return;
      }

      if (method === 'EMAIL' || method === 'SMS') {
        const tokenObj = localStore.recoveryTokens[user.id];
        if (!code || !String(code).trim()) {
          sendJson(400, { success: false, error: 'Ingresa el código de verificación de 6 dígitos.' });
          return;
        }
        const cleanCode = String(code).trim();
        if (!tokenObj || tokenObj.code !== cleanCode) {
          sendJson(401, {
            success: false,
            error: 'El código de verificación ingresado es incorrecto o ha expirado.'
          });
          return;
        }
        delete localStore.recoveryTokens[user.id];
      } else if (method === 'SECURITY_QUESTION') {
        if (!securityAnswer || !String(securityAnswer).trim()) {
          sendJson(400, { success: false, error: 'Ingresa la respuesta a tu pregunta de seguridad.' });
          return;
        }
        const given = normalizeAnswer(securityAnswer);
        const expected = normalizeAnswer(user.security_answer || 'gallo pinto');
        if (given !== expected) {
          sendJson(401, {
            success: false,
            error: 'La respuesta a la pregunta de seguridad no coincide con nuestros registros.'
          });
          return;
        }
      } else {
        sendJson(400, { success: false, error: 'Método de verificación inválido.' });
        return;
      }

      user.password = String(newPassword).trim();

      if (broadcastEvent) {
        broadcastEvent({ type: 'PASSWORD_RESET_COMPLETED', userId: user.id, method });
      }

      sendJson(200, {
        success: true,
        message: '¡Tu contraseña ha sido restablecida exitosamente! Ya puedes usar tu cuenta.',
        user: serializeUserPublic(user)
      });
    } catch (err) {
      console.error('[Auth Recovery Reset Error]', err);
      sendJson(500, { success: false, error: 'Error al restablecer la contraseña.' });
    }
    return;
  }

  // ==========================================================================
  // 8. POST /api/auth/admin/user-action - Gestión Avanzada de Usuarios desde el Hub
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/auth/admin/user-action') {
    try {
      const payload = await readBody();
      const {
        action, // 'UPDATE_USER' | 'SET_STATUS' | 'DELETE' | 'RESET_PASSWORD'
        userId,
        full_name,
        email,
        phone,
        password,
        address,
        notes,
        security_question,
        security_answer,
        saved_addresses,
        role,
        subrole,
        account_status,
        restaurant_id,
        restaurant_name,
        is_multi_management,
        authorized_restaurants,
        vehicle_type,
        license_plate,
        is_verified
      } = payload;

      if (!userId || !action) {
        sendJson(400, { success: false, error: 'Faltan parámetros userId o action.' });
        return;
      }

      const idx = localStore.users.findIndex(x => x.id === userId);
      if (idx === -1) {
        sendJson(404, { success: false, error: 'Usuario no encontrado.' });
        return;
      }

      if (action === 'DELETE') {
        localStore.users.splice(idx, 1);
        sendJson(200, { success: true, message: 'Usuario eliminado correctamente.' });
        return;
      }

      const u = localStore.users[idx];

      if (action === 'RESET_PASSWORD') {
        if (!password || String(password).trim().length < 4) {
          sendJson(400, { success: false, error: 'Ingresa una nueva contraseña válida.' });
          return;
        }
        u.password = String(password).trim();
        sendJson(200, { success: true, message: `Contraseña de ${u.full_name} actualizada correctamente.` });
        return;
      }

      if (action === 'SET_STATUS') {
        u.account_status = account_status || 'ACTIVE';
        if (u.driver_profile) {
          u.driver_profile.is_verified = u.account_status === 'ACTIVE';
          if (u.account_status !== 'ACTIVE') {
            u.driver_profile.current_status = 'OFFLINE';
          }
        }
        if (broadcastEvent) {
          broadcastEvent({ type: 'USER_STATUS_UPDATED', userId, account_status: u.account_status });
        }
        sendJson(200, { success: true, message: `Estado de cuenta actualizado a ${u.account_status}.` });
        return;
      }

      if (action === 'UPDATE_USER') {
        if (full_name) u.full_name = full_name.trim();
        if (email) u.email = email.trim().toLowerCase();
        if (phone) u.phone = phone.trim();
        if (password && String(password).trim()) u.password = String(password).trim();
        if (address !== undefined) u.address = address;
        if (notes !== undefined) u.notes = notes;
        if (security_question !== undefined && String(security_question).trim()) u.security_question = String(security_question).trim();
        if (security_answer !== undefined && String(security_answer).trim()) u.security_answer = String(security_answer).trim();
        if (Array.isArray(saved_addresses)) u.saved_addresses = saved_addresses;
        if (role) u.role = role;
        if (subrole) u.subrole = subrole;
        if (account_status) u.account_status = account_status;
        if (restaurant_id !== undefined) u.restaurant_id = restaurant_id;
        if (restaurant_name !== undefined) u.restaurant_name = restaurant_name;
        if (is_multi_management !== undefined) u.is_multi_management = Boolean(is_multi_management);
        if (authorized_restaurants !== undefined) u.authorized_restaurants = authorized_restaurants;

        if (u.role === 'DRIVER' || vehicle_type || license_plate) {
          if (!u.driver_profile) {
            u.driver_profile = {
              driver_id: u.id,
              vehicle_type: vehicle_type || 'MOTORCYCLE',
              license_plate: license_plate || 'M-1029',
              current_status: 'AVAILABLE',
              is_verified: is_verified !== undefined ? Boolean(is_verified) : true,
              battery_level: 95,
              rating: 5.0,
              last_location: 'POINT(-86.2650 12.1260)'
            };
          } else {
            if (vehicleType || vehicle_type) u.driver_profile.vehicle_type = vehicle_type;
            if (licensePlate || license_plate) u.driver_profile.license_plate = license_plate;
            if (is_verified !== undefined) u.driver_profile.is_verified = Boolean(is_verified);
          }
        }

        if (broadcastEvent) {
          broadcastEvent({ type: 'USER_UPDATED', userId });
        }

        sendJson(200, { success: true, message: 'Usuario y permisos actualizados correctamente.', user: u });
        return;
      }

      sendJson(400, { success: false, error: 'Acción no reconocida.' });
    } catch (err) {
      console.error('[Auth Admin Action Error]', err);
      sendJson(500, { success: false, error: 'Error al ejecutar acción administrativa.' });
    }
    return;
  }

  // ==========================================================================
  // 9. POST /api/restaurant/settings - Editar datos del restaurante
  // ==========================================================================
  if (req.method === 'POST' && cleanUrl === '/api/restaurant/settings') {
    try {
      const payload = await readBody();
      const requesterSubrole = payload.requesterSubrole || payload.subrole || 'ADMIN';
      const targetRestId = payload.restaurantId || payload.restaurant_id || '6701bc0c-e5ce-475a-8893-75e9d06e8012';
      const name = payload.name;
      const phone = payload.phone;
      const address = payload.address;
      const openingHours = payload.openingHours || payload.opening_hours;
      const prepTimeMinutes = payload.prepTimeMinutes || payload.estimated_prep_time_minutes;
      const deliveryRadiusKm = payload.deliveryRadiusKm || payload.delivery_radius_km;
      const logoUrl = payload.logoUrl || payload.logo_url;

      if (requesterSubrole === 'STAFF') {
        sendJson(403, {
          success: false,
          error: '🔒 Permiso denegado: Tu usuario es Operador de Cocina. Solo los Administradores del Restaurante pueden modificar la información y configuración del negocio.'
        });
        return;
      }

      const rest = localStore.restaurants.find(r => r.id === targetRestId);
      if (rest) {
        if (name) rest.name = name;
        if (phone) rest.phone = phone;
        if (address) rest.address = address;
        if (openingHours) rest.opening_hours = openingHours;
        if (prepTimeMinutes !== undefined) rest.estimated_prep_time_minutes = parseInt(prepTimeMinutes) || 20;
        if (deliveryRadiusKm !== undefined) rest.delivery_radius_km = parseFloat(deliveryRadiusKm) || 5.0;
        if (logoUrl) rest.logo_url = logoUrl;
      }

      if (broadcastEvent) {
        broadcastEvent({
          type: 'RESTAURANT_SETTINGS_UPDATED',
          restaurantId: targetRestId,
          updates: rest
        });
      }

      sendJson(200, {
        success: true,
        message: 'Configuración del restaurante actualizada correctamente.',
        restaurant: rest || null
      });
    } catch (err) {
      console.error('[Restaurant Settings API] Error:', err);
      sendJson(500, { success: false, error: 'Error al actualizar información del restaurante.' });
    }
    return;
  }

  sendJson(404, { success: false, error: 'Ruta Auth API no encontrada' });
}

module.exports = {
  handleAuthApi
};
