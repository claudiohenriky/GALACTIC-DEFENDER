import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio } from '../src/audio/game-audio.js';

test('audio mixer exposes independent bounded channels', () => {
  const audio = new GameAudio();
  audio.setChannelVolume('music', 1.4);
  audio.setChannelVolume('effects', -0.5);
  audio.setChannelVolume('voice', 0.35);
  assert.equal(audio.channelVolumes.music, 1);
  assert.equal(audio.channelVolumes.effects, 0);
  assert.equal(audio.channelVolumes.voice, 0.35);
});

test('music mode switches between ambient, combat and boss arrangements', () => {
  const audio = new GameAudio();
  audio.setMusicMode('ambient');
  assert.equal(audio.musicMode, 'ambient');
  audio.setMusicMode('boss');
  assert.equal(audio.musicMode, 'boss');
  audio.setMusicMode('unknown');
  assert.equal(audio.musicMode, 'combat');
  assert.equal(audio.musicStep, 0);
});

test('navigation and warning cues safely no-op before audio unlock', () => {
  const audio = new GameAudio();
  assert.doesNotThrow(() => audio.playUiConfirm());
  assert.doesNotThrow(() => audio.playNavigationCue('forward'));
  assert.doesNotThrow(() => audio.playNavigationCue('back'));
  assert.doesNotThrow(() => audio.playSystemAlert('warning'));
  assert.doesNotThrow(() => audio.playDialogueLine('system'));
  assert.doesNotThrow(() => audio.playDialogueTick('system', 12, 'test'));
});

test('audio can be disabled and volume changes remain clamped', () => {
  const audio = new GameAudio();
  audio.setVolume(2);
  assert.equal(audio.volume, 1);
  audio.setVolume(-1);
  assert.equal(audio.volume, 0);
  audio.setEnabled(false);
  assert.equal(audio.enabled, false);
});
