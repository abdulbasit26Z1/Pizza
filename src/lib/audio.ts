// Web Audio API Sound Engine for Cyber Synthwave Music & SFX

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicVolumeNode: GainNode | null = null;
  private sfxVolumeNode: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicInterval: number | null = null;
  private musicStep = 0;

  private musicVolume = 0.6;
  private sfxVolume = 0.8;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.musicVolumeNode = this.ctx.createGain();
      this.musicVolumeNode.gain.value = this.musicVolume;
      this.musicVolumeNode.connect(this.masterGain);

      this.sfxVolumeNode = this.ctx.createGain();
      this.sfxVolumeNode.gain.value = this.sfxVolume;
      this.sfxVolumeNode.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(music: number, sfx: number) {
    this.musicVolume = music;
    this.sfxVolume = sfx;
    if (this.musicVolumeNode) this.musicVolumeNode.gain.value = music;
    if (this.sfxVolumeNode) this.sfxVolumeNode.gain.value = sfx;
  }

  // --- SOUND EFFECTS ---

  public playHorn() {
    this.initContext();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(380, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(475, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.35);
    osc2.stop(this.ctx.currentTime + 0.35);
  }

  public playTireScreech() {
    this.initContext();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, this.ctx.currentTime);
    filter.Q.value = 5.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolumeNode);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.2);
  }

  public playTireBurst() {
    this.initContext();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolumeNode);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.5);
  }

  public playRefuel() {
    this.initContext();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  public playCashRegister() {
    this.initContext();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const notes = [987.77, 1318.51, 1567.98]; // B5, E6, G6
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxVolumeNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const t = this.ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxVolumeNode);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  public playDeliveryComplete() {
    this.initContext();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    arpeggio.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxVolumeNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      const t = this.ctx.currentTime + idx * 0.07;
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxVolumeNode);

      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playJump() {
    this.initContext();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playSlide() {
    this.initContext();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  public playOrbCollect() {
    this.initContext();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const note = notes[Math.floor(Math.random() * notes.length)];

    osc.frequency.setValueAtTime(note, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(note * 1.5, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playPowerup() {
    this.initContext();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxVolumeNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = this.ctx.currentTime + idx * 0.06;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxVolumeNode);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  public playCrash() {
    this.initContext();
    if (!this.ctx || !this.sfxVolumeNode) return;

    // Noise buffer for explosion rumble
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolumeNode);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.4);
  }

  public playCheckpointPass() {
    this.initContext();
    if (!this.ctx || !this.sfxVolumeNode) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxVolumeNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const t = this.ctx.currentTime + i * 0.05;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxVolumeNode);

      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  // --- SYNTHWAVE & BOLLYWOOD ACTION MUSIC SEQUENCER ---

  public startMusic() {
    this.initContext();
    if (this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    this.musicStep = 0;

    const tempo = 132; // Energetic BPM
    const stepDuration = (60 / tempo) / 4; // 16th notes

    this.musicInterval = window.setInterval(() => {
      this.playSynthwaveStep();
      this.musicStep = (this.musicStep + 1) % 32;
    }, stepDuration * 1000);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  private playSynthwaveStep() {
    if (!this.ctx || !this.musicVolumeNode || this.musicVolume <= 0) return;

    const now = this.ctx.currentTime;

    // Fast-pumping Hindi Action / Dholak Synth Beat & Bassline
    const basslineProgression = [
      65.41, 65.41, 130.81, 65.41, 65.41, 130.81, 87.31, 65.41, // C Minor Hook
      58.27, 58.27, 116.54, 58.27, 58.27, 116.54, 77.78, 58.27, // A# Major
      49.00, 49.00, 98.00, 49.00, 49.00, 98.00, 73.42, 49.00,  // G Major
      65.41, 77.78, 87.31, 98.00, 116.54, 130.81, 146.83, 155.56 // Ascending Run
    ];

    const freq = basslineProgression[this.musicStep % basslineProgression.length];

    // Bass Synth
    const bassOsc = this.ctx.createOscillator();
    const bassFilter = this.ctx.createBiquadFilter();
    const bassGain = this.ctx.createGain();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.value = freq;

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(550, now);
    bassFilter.frequency.exponentialRampToValueAtTime(140, now + 0.1);

    bassGain.gain.setValueAtTime(0.22, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this.musicVolumeNode);

    bassOsc.start(now);
    bassOsc.stop(now + 0.12);

    // Dholak / Synth Percussion Clap on beats 4, 12, 20, 28
    if (this.musicStep % 4 === 2) {
      const noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuf;

      const pFilter = this.ctx.createBiquadFilter();
      pFilter.type = 'highpass';
      pFilter.frequency.value = 1200;

      const pGain = this.ctx.createGain();
      pGain.gain.setValueAtTime(0.18, now);
      pGain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

      noise.connect(pFilter);
      pFilter.connect(pGain);
      pGain.connect(this.musicVolumeNode);

      noise.start(now);
      noise.stop(now + 0.07);
    }

    // Upbeat Lead Brass / Melodic Riff (Job Tere Sarkari A Action Vibe)
    if (this.musicStep % 2 === 0) {
      const leadNotes = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25]; // C Minor Pentatonic
      const leadFreq = leadNotes[(this.musicStep / 2) % leadNotes.length];

      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();

      leadOsc.type = 'sawtooth';
      leadOsc.frequency.value = leadFreq;

      leadGain.gain.setValueAtTime(0.09, now);
      leadGain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);

      leadOsc.connect(leadGain);
      leadGain.connect(this.musicVolumeNode);

      leadOsc.start(now);
      leadOsc.stop(now + 0.1);
    }
  }
}

export const soundEngine = new SoundEngine();
