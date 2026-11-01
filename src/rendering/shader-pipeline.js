export const SHADER_MODES = Object.freeze(['off', 'low', 'medium', 'high']);

export function normalizeShaderSettings(settings = {}) {
  const mode = SHADER_MODES.includes(settings.mode) ? settings.mode : 'off';
  return {
    mode,
    colorGrade: settings.colorGrade !== false,
    vignette: settings.vignette !== false,
    scanlines: Boolean(settings.scanlines),
    chromaticAberration: Boolean(settings.chromaticAberration)
  };
}

export function getShaderUniforms(settings = {}) {
  const config = normalizeShaderSettings(settings);
  if (config.mode === 'off') {
    return { colorGrade: 0, vignette: 0, scanlines: 0, chromaticAberration: 0 };
  }
  const mediumOrHigher = config.mode === 'medium' || config.mode === 'high';
  const highOnly = config.mode === 'high';
  return {
    colorGrade: config.colorGrade ? 1 : 0,
    vignette: config.vignette ? 1 : 0,
    scanlines: mediumOrHigher && config.scanlines ? 1 : 0,
    chromaticAberration: highOnly && config.chromaticAberration ? 1 : 0
  };
}

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_texel;
uniform float u_colorGrade;
uniform float u_vignette;
uniform float u_scanlines;
uniform float u_chromaticAberration;
varying vec2 v_uv;

void main() {
  vec3 color = texture2D(u_texture, v_uv).rgb;
  if (u_chromaticAberration > 0.5) {
    float offset = u_texel.x * 1.35;
    color.r = texture2D(u_texture, v_uv + vec2(offset, 0.0)).r;
    color.b = texture2D(u_texture, v_uv - vec2(offset, 0.0)).b;
  }
  if (u_colorGrade > 0.5) {
    color = pow(max(color, vec3(0.0)), vec3(0.985, 0.99, 1.015));
    color.r *= 1.012;
    color.b *= 0.992;
  }
  if (u_vignette > 0.5) {
    vec2 centered = (v_uv - 0.5) * vec2(u_resolution.x / max(1.0, u_resolution.y), 1.0);
    float edge = smoothstep(0.34, 0.82, length(centered));
    color *= 1.0 - edge * 0.19;
  }
  if (u_scanlines > 0.5) {
    float line = 0.988 + 0.012 * sin(v_uv.y * u_resolution.y * 1.35);
    color *= line;
  }
  gl_FragColor = vec4(color, 1.0);
}`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create WebGL shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Shader compilation failed';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export class ShaderPipeline {
  constructor(sourceCanvas) {
    this.sourceCanvas = sourceCanvas;
    this.frame = sourceCanvas?.parentElement ?? null;
    this.outputCanvas = null;
    this.gl = null;
    this.program = null;
    this.texture = null;
    this.buffer = null;
    this.uniforms = null;
    this.settings = normalizeShaderSettings();
    this.available = false;
    this.enabled = false;
    this.textureWidth = 0;
    this.textureHeight = 0;
    this.contextLost = false;
  }

  setSettings(settings = {}) {
    this.settings = normalizeShaderSettings(settings);
    this.enabled = this.settings.mode !== 'off';
    if (!this.enabled) {
      this.frame?.classList.remove('shader-enabled');
      return true;
    }
    if (!this.available && !this.initialize()) {
      this.enabled = false;
      this.frame?.classList.remove('shader-enabled');
      return false;
    }
    this.frame?.classList.add('shader-enabled');
    return true;
  }

  initialize() {
    if (!this.sourceCanvas || !this.frame || typeof document === 'undefined') return false;
    const output = document.createElement('canvas');
    output.className = 'shader-output-canvas';
    output.setAttribute('aria-hidden', 'true');
    output.setAttribute('role', 'presentation');
    const gl = output.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power'
    });
    if (!gl) return false;

    try {
      const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      const program = gl.createProgram();
      if (!program) throw new Error('Unable to create WebGL program');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'WebGL program link failed');
      }

      const buffer = gl.createBuffer();
      const texture = gl.createTexture();
      if (!buffer || !texture) throw new Error('Unable to allocate WebGL resources');
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

      this.uniforms = {
        texture: gl.getUniformLocation(program, 'u_texture'),
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        texel: gl.getUniformLocation(program, 'u_texel'),
        colorGrade: gl.getUniformLocation(program, 'u_colorGrade'),
        vignette: gl.getUniformLocation(program, 'u_vignette'),
        scanlines: gl.getUniformLocation(program, 'u_scanlines'),
        chromaticAberration: gl.getUniformLocation(program, 'u_chromaticAberration')
      };
      gl.uniform1i(this.uniforms.texture, 0);
      this.outputCanvas = output;
      this.gl = gl;
      this.program = program;
      this.texture = texture;
      this.buffer = buffer;
      this.available = true;
      this.frame.appendChild(output);
      output.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        this.contextLost = true;
        this.available = false;
        this.frame?.classList.remove('shader-enabled');
      });
      output.addEventListener('webglcontextrestored', () => {
        this.available = false;
        this.contextLost = false;
        this.initialize();
        if (this.enabled && this.available) this.frame?.classList.add('shader-enabled');
      });
      return true;
    } catch (error) {
      console.warn('[GALACTIC-DEFENDER] WebGL shader pipeline unavailable:', error);
      output.remove();
      return false;
    }
  }

  render(sourceCanvas = this.sourceCanvas) {
    if (!this.enabled || !this.available || !this.gl || !this.outputCanvas || !sourceCanvas) return;
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    if (width < 1 || height < 1) return;
    const gl = this.gl;
    if (this.outputCanvas.width !== width || this.outputCanvas.height !== height) {
      this.outputCanvas.width = width;
      this.outputCanvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    if (this.textureWidth !== width || this.textureHeight !== height) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      this.textureWidth = width;
      this.textureHeight = height;
    }
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
    gl.uniform2f(this.uniforms.resolution, width, height);
    gl.uniform2f(this.uniforms.texel, 1 / width, 1 / height);
    const values = getShaderUniforms(this.settings);
    gl.uniform1f(this.uniforms.colorGrade, values.colorGrade);
    gl.uniform1f(this.uniforms.vignette, values.vignette);
    gl.uniform1f(this.uniforms.scanlines, values.scanlines);
    gl.uniform1f(this.uniforms.chromaticAberration, values.chromaticAberration);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
