const WEAK_PASSWORDS = new Set([
  '12345678',
  '123456789',
  'abc12345',
  'password123',
  'password123!',
  'qwerty123',
  'qwerty123!',
  'admin1234',
  'admin1234!',
  'nexcore123',
  'nexcore123!'
]);

function hasSequence(value) {
  const normalized = value.toLowerCase();
  const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

  return sequences.some(sequence => {
    for (let size = 4; size <= Math.min(sequence.length, normalized.length); size += 1) {
      for (let index = 0; index <= sequence.length - size; index += 1) {
        if (normalized.includes(sequence.slice(index, index + size))) return true;
      }
    }
    return false;
  });
}

export function validatePassword(password) {
  const errors = [];
  const value = String(password || '');

  if (value.length < 8) errors.push('La contraseña debe tener al menos 8 caracteres.');
  if (!/[A-Z]/.test(value)) errors.push('La contraseña debe incluir una mayúscula.');
  if (!/[a-z]/.test(value)) errors.push('La contraseña debe incluir una minúscula.');
  if (!/[0-9]/.test(value)) errors.push('La contraseña debe incluir un número.');
  if (!/[^A-Za-z0-9]/.test(value)) errors.push('La contraseña debe incluir un carácter especial.');
  if (/\s/.test(value)) errors.push('La contraseña no debe incluir espacios.');
  if (WEAK_PASSWORDS.has(value.toLowerCase()) || hasSequence(value)) {
    errors.push('La contraseña es demasiado débil o consecutiva.');
  }

  return errors;
}
