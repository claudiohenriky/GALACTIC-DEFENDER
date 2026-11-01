import test from 'node:test';
import assert from 'node:assert/strict';
import { getShaderUniforms, normalizeShaderSettings, SHADER_MODES } from '../src/rendering/shader-pipeline.js';

test('shader settings accept only the four supported quality modes', () => {
  assert.deepEqual(SHADER_MODES, ['off', 'low', 'medium', 'high']);
  assert.equal(normalizeShaderSettings({ mode: 'ultra' }).mode, 'off');
});

test('shader post-processing is fully disabled by default and in off mode', () => {
  assert.deepEqual(getShaderUniforms(), {
    colorGrade: 0, vignette: 0, scanlines: 0, chromaticAberration: 0
  });
  assert.deepEqual(getShaderUniforms({
    mode: 'off', colorGrade: true, vignette: true, scanlines: true, chromaticAberration: true
  }), {
    colorGrade: 0, vignette: 0, scanlines: 0, chromaticAberration: 0
  });
});

test('low preset limits processing to color grading and vignette', () => {
  assert.deepEqual(getShaderUniforms({
    mode: 'low', colorGrade: true, vignette: true, scanlines: true, chromaticAberration: true
  }), {
    colorGrade: 1, vignette: 1, scanlines: 0, chromaticAberration: 0
  });
});

test('medium preset enables optional scanlines but not chromatic aberration', () => {
  assert.deepEqual(getShaderUniforms({
    mode: 'medium', colorGrade: true, vignette: false, scanlines: true, chromaticAberration: true
  }), {
    colorGrade: 1, vignette: 0, scanlines: 1, chromaticAberration: 0
  });
});

test('high preset exposes all independently configurable effects', () => {
  assert.deepEqual(getShaderUniforms({
    mode: 'high', colorGrade: false, vignette: true, scanlines: true, chromaticAberration: true
  }), {
    colorGrade: 0, vignette: 1, scanlines: 1, chromaticAberration: 1
  });
});

test('disabled individual effects remain disabled in every preset', () => {
  assert.deepEqual(getShaderUniforms({
    mode: 'high', colorGrade: false, vignette: false, scanlines: false, chromaticAberration: false
  }), {
    colorGrade: 0, vignette: 0, scanlines: 0, chromaticAberration: 0
  });
});
