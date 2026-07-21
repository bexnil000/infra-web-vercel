import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('las APIs privadas exigen sesión y filtran por propietario', () => { for (const file of ['api/projects.js', 'api/tasks.js', 'api/dashboard.js']) { const source = readFileSync(file, 'utf8'); assert.match(source, /requireUser\(req\)/); assert.match(source, /owner_id/); } });
test('la migración activa RLS y revoca acceso público', () => { const sql = readFileSync('migrations/20260719_project_management.sql', 'utf8'); assert.match(sql, /enable row level security/gi); assert.match(sql, /revoke all .* anon, authenticated/i); assert.doesNotMatch(sql, /using\s*\(\s*true\s*\)/i); });
test('la colaboración conserva RLS y relaciones en cascada', () => { const sql = readFileSync('migrations/20260720_collaboration_assistant.sql', 'utf8'); assert.match(sql, /project_members[\s\S]*on delete cascade/i); assert.match(sql, /task_comments[\s\S]*on delete cascade/i); assert.match(sql, /notifications[\s\S]*enable row level security/i); assert.match(sql, /revoke all .* anon, authenticated/i); });
test('invitaciones y comentarios validan sesión y propiedad', () => { const source = readFileSync('api/collaboration.js', 'utf8'); assert.match(source, /requireUser\(req\)/); assert.match(source, /Solo el propietario puede invitar/); assert.match(source, /No tienes acceso a la tarea/); });
