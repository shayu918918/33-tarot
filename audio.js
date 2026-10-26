(() => {
  'use strict';
  const Context = window.AudioContext || window.webkitAudioContext;
  let enabled = true;
  try { enabled = window.localStorage.getItem('33-tarot-sound') !== 'off'; } catch (_) {}
  let context, master, noiseBuffer;
  const voices = new Set();
  const envelopes = new Map();

  function stop() {
    if (!context) return;
    const end = context.currentTime + .025;
    for (const voice of voices) {
      const gain = envelopes.get(voice);
      try {
        if (gain?.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(context.currentTime);
        else gain?.cancelScheduledValues(context.currentTime);
        gain?.setTargetAtTime(.0001, context.currentTime, .006);
        voice.stop(end);
      } catch (_) {}
    }
    voices.clear();
  }
  function unlock() {
    if (!enabled || !Context) return;
    try {
      if (!context) {
        context = new Context({ latencyHint: 'interactive' });
        master = context.createGain(); master.gain.value = .28;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -15; compressor.knee.value = 10;
        compressor.ratio.value = 3; compressor.attack.value = .004; compressor.release.value = .13;
        master.connect(compressor); compressor.connect(context.destination);
        const length = Math.ceil(context.sampleRate * 1.3);
        noiseBuffer = context.createBuffer(1, length, context.sampleRate);
        const channel = noiseBuffer.getChannelData(0);
        let smooth = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          smooth = .72 * smooth + .28 * white;
          channel[i] = .63 * white + .37 * smooth;
        }
      }
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch (_) { context = null; }
  }
  function ready() { return enabled && context?.state === 'running' && master; }
  function release(source, nodes, gain) {
    voices.add(source);
    envelopes.set(source, gain);
    source.onended = () => {
      voices.delete(source);
      envelopes.delete(source);
      nodes.forEach(node => { try { node.disconnect(); } catch (_) {} });
    };
  }
  function paper({ delay = 0, duration = .14, gain = .15, frequency = 1700, endFrequency = 2300, pan = 0 } = {}) {
    if (!ready()) return;
    const t = context.currentTime + delay;
    const source = context.createBufferSource(); source.buffer = noiseBuffer;
    const highpass = context.createBiquadFilter(); highpass.type = 'highpass'; highpass.frequency.value = 380;
    const bandpass = context.createBiquadFilter(); bandpass.type = 'bandpass'; bandpass.Q.value = .64;
    bandpass.frequency.setValueAtTime(frequency, t); bandpass.frequency.exponentialRampToValueAtTime(endFrequency, t + duration);
    const lowpass = context.createBiquadFilter(); lowpass.type = 'lowpass'; lowpass.frequency.value = 5200;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(.0001, t);
    envelope.gain.exponentialRampToValueAtTime(gain, t + Math.min(.018, duration * .16));
    envelope.gain.exponentialRampToValueAtTime(gain * .38, t + duration * .58);
    envelope.gain.exponentialRampToValueAtTime(.0001, t + duration);
    source.connect(highpass); highpass.connect(bandpass); bandpass.connect(lowpass); lowpass.connect(envelope);
    const nodes = [source, highpass, bandpass, lowpass, envelope];
    if (context.createStereoPanner) {
      const panner = context.createStereoPanner(); panner.pan.value = pan;
      envelope.connect(panner); panner.connect(master); nodes.push(panner);
    } else envelope.connect(master);
    release(source, nodes, envelope.gain);
    source.start(t, Math.random() * .55); source.stop(t + duration + .025);
  }
  function tone(frequency, volume, duration, delay = 0) {
    if (!ready()) return;
    const t = context.currentTime + delay;
    const oscillator = context.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(.0001, t);
    envelope.gain.exponentialRampToValueAtTime(volume, t + .014);
    envelope.gain.exponentialRampToValueAtTime(.0001, t + duration);
    oscillator.connect(envelope); envelope.connect(master);
    release(oscillator, [oscillator, envelope], envelope.gain); oscillator.start(t); oscillator.stop(t + duration + .025);
  }
  function cut() {
    paper({ duration: .105, gain: .17, frequency: 1450, endFrequency: 1950, pan: -.12 });
    paper({ delay: .09, duration: .15, gain: .13, frequency: 2050, endFrequency: 1350, pan: .1 });
    paper({ delay: .23, duration: .075, gain: .095, frequency: 1050, endFrequency: 1450 });
  }
  function fan() {
    for (let i = 0; i < 6; i++) paper({ delay: i * .033, duration: .068, gain: .075 - i * .004, frequency: 1550 + i * 100, endFrequency: 2300, pan: (i - 2.5) * .035 });
  }
  function lift() { paper({ duration: .145, gain: .12, frequency: 1150, endFrequency: 1900, pan: -.025 }); }
  function flip(delay = .15) {
    paper({ delay, duration: .23, gain: .16, frequency: 1050, endFrequency: 2850, pan: .025 });
    paper({ delay: delay + .22, duration: .052, gain: .075, frequency: 1100, endFrequency: 850 });
  }
  function reveal(delay = 0) {
    tone(1046.5, .052, .82, delay);
    tone(2101.4, .0095, .46, delay + .006);
    tone(3155.3, .0028, .27, delay + .009);
  }
  function toggle() {
    enabled = !enabled;
    try { window.localStorage.setItem('33-tarot-sound', enabled ? 'on' : 'off'); } catch (_) {}
    if (!enabled) stop(); else unlock();
    return enabled;
  }
  window.TarotSound = Object.freeze({ available: !!Context, get enabled() { return enabled; }, unlock, stop, cut, fan, lift, flip, reveal, toggle });
})();
