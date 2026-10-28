const tracks = [
  {
    id: 'midnight-drive',
    name: 'Midnight Drive',
    bpm: 128,
    key: 'A MIN',
    art: 'MD',
    color: '#68f3ff',
    sequence: [220, 220, 277, 277, 330, 247, 220, 247],
    accent: '#7a7cff'
  },
  {
    id: 'neon-pulse',
    name: 'Neon Pulse',
    bpm: 132,
    key: 'C# MIN',
    art: 'NP',
    color: '#ff47d8',
    sequence: [196, 196, 247, 247, 294, 262, 247, 220],
    accent: '#ff8ad6'
  },
  {
    id: 'city-lights',
    name: 'City Lights',
    bpm: 124,
    key: 'F MAJ',
    art: 'CL',
    color: '#b9ff5a',
    sequence: [174, 174, 220, 196, 261, 220, 196, 174],
    accent: '#b9ff5a'
  },
  {
    id: 'afterglow',
    name: 'Afterglow',
    bpm: 126,
    key: 'D MIN',
    art: 'AG',
    color: '#7a7cff',
    sequence: [146, 174, 220, 174, 196, 220, 174, 146],
    accent: '#68f3ff'
  },
  {
    id: 'signal-rush',
    name: 'Signal Rush',
    bpm: 136,
    key: 'G# MIN',
    art: 'SR',
    color: '#ff9a3d',
    sequence: [196, 196, 246, 246, 293, 246, 220, 196],
    accent: '#ffd779'
  }
];

let selectedDeck = 'A';

const deckState = {
  A: {
    track: tracks[0],
    isPlaying: false,
    volume: 0.82,
    output: null,
    intervalId: null,
    step: 0,
    progress: 0,
    startedAt: 0,
    cue: false
  },
  B: {
    track: tracks[1],
    isPlaying: false,
    volume: 0.88,
    output: null,
    intervalId: null,
    step: 0,
    progress: 0,
    startedAt: 0,
    cue: false
  }
};

const els = {
  deckAName: document.getElementById('deckAName'),
  deckBName: document.getElementById('deckBName'),
  deckABpm: document.getElementById('deckABpm'),
  deckBBpm: document.getElementById('deckBBpm'),
  deckAKey: document.getElementById('deckAKey'),
  deckBKey: document.getElementById('deckBKey'),
  tempoDisplay: document.getElementById('tempoDisplay'),
  trackList: document.getElementById('trackList'),
  nowPlaying: document.getElementById('nowPlaying'),
  crossfader: document.getElementById('crossfader'),
  masterVolume: document.getElementById('masterVolume'),
  masterLevelValue: document.getElementById('masterLevelValue'),
  deckAVolume: document.getElementById('deckAVolume'),
  deckBVolume: document.getElementById('deckBVolume'),
  vinylA: document.getElementById('vinylA'),
  vinylB: document.getElementById('vinylB'),
  visualizerA: document.getElementById('visualizerA'),
  visualizerB: document.getElementById('visualizerB'),
  progressA: document.getElementById('progressA'),
  progressB: document.getElementById('progressB'),
  waveformA: document.getElementById('waveformA'),
  waveformB: document.getElementById('waveformB'),
  deckPanelA: document.getElementById('deckPanelA'),
  deckPanelB: document.getElementById('deckPanelB'),
  eqLow: document.getElementById('eqLow'),
  eqMid: document.getElementById('eqMid'),
  eqHigh: document.getElementById('eqHigh')
};

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioContext.createGain();
const masterFilter = audioContext.createBiquadFilter();
masterFilter.type = 'lowpass';
masterFilter.frequency.value = 16000;
masterGain.gain.value = 0.78;
masterFilter.connect(masterGain);
masterGain.connect(audioContext.destination);

function initDeckOutput(deckKey) {
  if (deckState[deckKey].output) return deckState[deckKey].output;

  const output = {
    gain: audioContext.createGain(),
    filter: audioContext.createBiquadFilter(),
    panner: audioContext.createStereoPanner(),
    analyser: audioContext.createAnalyser()
  };

  output.analyser.fftSize = 1024;
  output.filter.type = 'lowpass';
  output.filter.frequency.value = 5000;
  output.gain.gain.value = deckState[deckKey].volume;
  output.gain.connect(output.filter);
  output.filter.connect(output.panner);
  output.panner.connect(output.analyser);
  output.analyser.connect(masterFilter);

  deckState[deckKey].output = output;
  return output;
}

function setSelectedDeck(deckKey) {
  selectedDeck = deckKey;
  els.deckPanelA.classList.toggle('selected', deckKey === 'A');
  els.deckPanelB.classList.toggle('selected', deckKey === 'B');
}

function renderLibrary() {
  els.trackList.innerHTML = tracks
    .map(
      (track) => `
        <button class="track-item ${deckState.A.track.id === track.id || deckState.B.track.id === track.id ? 'active' : ''}" data-track-id="${track.id}" draggable="true">
          <span class="track-art" style="background: linear-gradient(135deg, ${track.color}, ${track.accent});">${track.art}</span>
          <span class="track-main">
            <span class="track-name">${track.name}</span>
            <span class="track-meta">${track.key}</span>
          </span>
          <span class="track-bpm">${track.bpm} BPM</span>
        </button>
      `
    )
    .join('');

  document.querySelectorAll('.track-item').forEach((button) => {
    button.addEventListener('click', () => loadTrackToDeck(button.dataset.trackId));
    button.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', button.dataset.trackId);
    });
    button.addEventListener('dragover', (event) => event.preventDefault());
    button.addEventListener('drop', (event) => {
      event.preventDefault();
      const draggedTrackId = event.dataTransfer.getData('text/plain');
      reorderTracks(draggedTrackId, button.dataset.trackId);
    });
  });
}

function reorderTracks(fromId, toId) {
  const fromIndex = tracks.findIndex((track) => track.id === fromId);
  const toIndex = tracks.findIndex((track) => track.id === toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

  const [removed] = tracks.splice(fromIndex, 1);
  tracks.splice(toIndex, 0, removed);
  renderLibrary();
}

function updateDeckLabels() {
  els.deckAName.textContent = deckState.A.track.name;
  els.deckBName.textContent = deckState.B.track.name;
  els.deckABpm.textContent = deckState.A.track.bpm;
  els.deckBBpm.textContent = deckState.B.track.bpm;
  els.deckAKey.textContent = deckState.A.track.key;
  els.deckBKey.textContent = deckState.B.track.key;
  els.tempoDisplay.textContent = `${Math.round((deckState.A.track.bpm + deckState.B.track.bpm) / 2)} BPM`;
  els.nowPlaying.textContent = deckState.A.isPlaying || deckState.B.isPlaying ? `${deckState.A.isPlaying ? deckState.A.track.name : deckState.B.track.name}` : 'Midnight Drive';
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = String(Math.floor(safe / 60)).padStart(2, '0');
  const secs = String(safe % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function updateWaveform(deckKey) {
  const deck = deckState[deckKey];
  const waveform = deckKey === 'A' ? els.waveformA : els.waveformB;
  const bars = waveform.querySelectorAll('span');
  const active = deck.isPlaying ? 0.9 : 0.4;

  bars.forEach((bar, index) => {
    const v = deck.track.sequence[index % deck.track.sequence.length] / 380;
    const value = Math.max(10, Math.min(100, v * 100));
    const base = index % 2 === 0 ? value * 0.9 : value * 0.6;
    bar.style.height = `${base}%`;
    bar.style.opacity = `${active}`;
  });

  const progressDisplay = deckKey === 'A' ? els.progressA : els.progressB;
  const totalSeconds = Math.max(1, (60 / deck.track.bpm) * 8 * 4);
  deck.progress = Math.min(totalSeconds, deck.progress + (deck.isPlaying ? 0.1 : 0));
  progressDisplay.textContent = formatTime(deck.progress);
}

function loadTrackToDeck(trackId) {
  const nextTrack = tracks.find((track) => track.id === trackId);
  if (!nextTrack) return;

  const targetDeck = deckState[selectedDeck];
  targetDeck.track = nextTrack;
  targetDeck.progress = 0;

  if (targetDeck.intervalId) {
    clearInterval(targetDeck.intervalId);
    targetDeck.intervalId = null;
  }

  if (targetDeck.isPlaying) {
    startDeckLoop(selectedDeck);
  }

  updateDeckLabels();
  renderLibrary();
}

function ensureAudioContext() {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function playTone(deckKey, frequency, duration = 0.18) {
  ensureAudioContext();
  const output = initDeckOutput(deckKey);
  const oscA = audioContext.createOscillator();
  const oscB = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscA.type = 'sawtooth';
  oscB.type = 'triangle';
  oscA.frequency.value = frequency;
  oscB.frequency.value = frequency / 2;

  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscA.connect(gainNode);
  oscB.connect(gainNode);
  gainNode.connect(output.gain);

  oscA.start(now);
  oscB.start(now);
  oscA.stop(now + duration);
  oscB.stop(now + duration);
}

function startDeckLoop(deckKey) {
  const deck = deckState[deckKey];
  if (!deck.track) return;

  if (deck.intervalId) {
    clearInterval(deck.intervalId);
  }

  const loopMs = (60 / deck.track.bpm) * 1000 * 0.5;

  deck.intervalId = setInterval(() => {
    const freq = deck.track.sequence[deck.step % deck.track.sequence.length];
    playTone(deckKey, freq, 0.16);
    deck.step += 1;
    deck.progress += loopMs / 1000;
  }, loopMs);
}

function toggleDeck(deckKey) {
  const deck = deckState[deckKey];
  deck.isPlaying = !deck.isPlaying;
  setSelectedDeck(deckKey);

  if (deck.isPlaying) {
    initDeckOutput(deckKey);
    startDeckLoop(deckKey);
    document.getElementById(`vinyl${deckKey}`).classList.add('playing');
  } else {
    if (deck.intervalId) {
      clearInterval(deck.intervalId);
      deck.intervalId = null;
    }
    document.getElementById(`vinyl${deckKey}`).classList.remove('playing');
  }

  updateDeckLabels();
}

function handleCue(deckKey) {
  const deck = deckState[deckKey];
  deck.step = 0;
  deck.progress = 0;
  deck.cue = true;
  if (deck.intervalId) {
    clearInterval(deck.intervalId);
    deck.intervalId = null;
  }
  if (deck.isPlaying) {
    startDeckLoop(deckKey);
  }
  updateDeckLabels();
}

function syncDecks(deckKey) {
  const deck = deckState[deckKey];
  const otherKey = deckKey === 'A' ? 'B' : 'A';
  const otherDeck = deckState[otherKey];
  if (otherDeck.isPlaying || deck.isPlaying) {
    deck.track = { ...otherDeck.track };
    deck.step = otherDeck.step;
    updateDeckLabels();
    renderLibrary();
  }

  if (deck.intervalId) {
    clearInterval(deck.intervalId);
    deck.intervalId = null;
  }
  if (deck.isPlaying) {
    startDeckLoop(deckKey);
  }
}

function syncAllDecks() {
  const averageBpm = Math.round((deckState.A.track.bpm + deckState.B.track.bpm) / 2);
  deckState.A.track = { ...deckState.A.track, bpm: averageBpm };
  deckState.B.track = { ...deckState.B.track, bpm: averageBpm };
  updateDeckLabels();
  renderLibrary();

  if (deckState.A.isPlaying) {
    startDeckLoop('A');
  }
  if (deckState.B.isPlaying) {
    startDeckLoop('B');
  }
}

function updateVisualizer(deckKey) {
  const deck = deckState[deckKey];
  const output = initDeckOutput(deckKey);
  const data = new Uint8Array(output.analyser.frequencyBinCount);
  output.analyser.getByteFrequencyData(data);

  const container = deckKey === 'A' ? els.visualizerA : els.visualizerB;
  const bars = container.querySelectorAll('span');

  bars.forEach((bar, index) => {
    const value = data[index * 4] || 10;
    const scale = Math.max(15, (value / 255) * 100);
    bar.style.height = `${scale}%`;
    bar.style.opacity = deck.isPlaying ? '1' : '0.35';
  });
}

function updateVolumeControls() {
  const crossfade = Number(els.crossfader.value) / 100;
  const aGain = 1 - crossfade;
  const bGain = crossfade;

  deckState.A.volume = Number(els.deckAVolume.value) / 100;
  deckState.B.volume = Number(els.deckBVolume.value) / 100;

  if (deckState.A.output) {
    deckState.A.output.gain.gain.value = deckState.A.volume * aGain;
  }
  if (deckState.B.output) {
    deckState.B.output.gain.gain.value = deckState.B.volume * bGain;
  }

  const master = Number(els.masterVolume.value) / 100;
  masterGain.gain.value = master;
  els.masterLevelValue.textContent = `${Math.round(master * 100)}%`;

  const eqLow = Number(els.eqLow.value) / 100;
  const eqMid = Number(els.eqMid.value) / 100;
  const eqHigh = Number(els.eqHigh.value) / 100;

  if (deckState.A.output) {
    deckState.A.output.filter.Q.value = 1 + eqMid * 12;
    deckState.A.output.filter.frequency.value = 180 + eqLow * 5000;
  }
  if (deckState.B.output) {
    deckState.B.output.filter.Q.value = 1 + eqHigh * 12;
    deckState.B.output.filter.frequency.value = 220 + eqHigh * 6000;
  }
}

function attachEvents() {
  document.querySelectorAll('.control-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const deckKey = button.dataset.deck;
      const action = button.dataset.action;

      if (action === 'play') {
        setSelectedDeck(deckKey);
        toggleDeck(deckKey);
      }
      if (action === 'cue') {
        setSelectedDeck(deckKey);
        handleCue(deckKey);
      }
      if (action === 'sync') {
        setSelectedDeck(deckKey);
        syncDecks(deckKey);
      }
    });
  });

  document.getElementById('syncBoth').addEventListener('click', syncAllDecks);
  els.crossfader.addEventListener('input', updateVolumeControls);
  els.masterVolume.addEventListener('input', updateVolumeControls);
  els.deckAVolume.addEventListener('input', updateVolumeControls);
  els.deckBVolume.addEventListener('input', updateVolumeControls);
  els.eqLow.addEventListener('input', updateVolumeControls);
  els.eqMid.addEventListener('input', updateVolumeControls);
  els.eqHigh.addEventListener('input', updateVolumeControls);

  document.addEventListener('keydown', (event) => {
    const tag = event.target.tagName;
    if (tag === 'INPUT') return;

    if (event.code === 'Space') {
      event.preventDefault();
      toggleDeck(selectedDeck);
    }

    if (event.key.toLowerCase() === 'a') {
      setSelectedDeck('A');
    }

    if (event.key.toLowerCase() === 'b') {
      setSelectedDeck('B');
    }

    if (event.key === 'ArrowUp') {
      const nextVolume = Math.min(100, Number(els.deckAVolume.value) + 5);
      els.deckAVolume.value = nextVolume;
      updateVolumeControls();
    }

    if (event.key === 'ArrowDown') {
      const nextVolume = Math.max(0, Number(els.deckAVolume.value) - 5);
      els.deckAVolume.value = nextVolume;
      updateVolumeControls();
    }
  });
}

function animate() {
  updateVisualizer('A');
  updateVisualizer('B');
  updateWaveform('A');
  updateWaveform('B');
  requestAnimationFrame(animate);
}

function init() {
  renderLibrary();
  updateDeckLabels();
  setSelectedDeck('A');
  attachEvents();
  updateVolumeControls();
  requestAnimationFrame(animate);
}

init();
