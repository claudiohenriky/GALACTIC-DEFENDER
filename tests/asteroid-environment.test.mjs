import test from 'node:test';
import assert from 'node:assert/strict';
import { Asteroid } from '../src/environment/asteroid.js';

test('asteroids have bounded health and deterministic rock geometry', () => {
  const a = new Asteroid(100, 100, 24, 7);
  const b = new Asteroid(100, 100, 24, 7);
  assert.ok(a.health > 0);
  assert.equal(a.vertices.length, b.vertices.length);
  assert.deepEqual(a.vertices, b.vertices);
});

test('asteroids drift and remain inside world bounds', () => {
  const rock = new Asteroid(4, 4, 20, 2);
  rock.vx = -30; rock.vy = -30;
  rock.update(1, 300, 300);
  assert.ok(rock.x >= rock.radius && rock.x <= 300 - rock.radius);
  assert.ok(rock.y >= rock.radius && rock.y <= 300 - rock.radius);
});

test('projectile damage destroys an asteroid exactly at zero health', () => {
  const rock = new Asteroid(100, 100, 20, 1);
  assert.equal(rock.damage(rock.health - 1), false);
  assert.equal(rock.active, true);
  assert.equal(rock.damage(1), true);
  assert.equal(rock.active, false);
});
