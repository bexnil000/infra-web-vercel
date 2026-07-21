import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePassword } from '../api/_lib/password.js';
test('acepta una contraseña robusta', () => assert.deepEqual(validatePassword('N3x!Core_segura'), []));
test('rechaza contraseñas débiles', () => assert.ok(validatePassword('password123!').length > 0));
test('exige mayúscula, número y carácter especial', () => assert.ok(validatePassword('sololetras').length >= 3));
