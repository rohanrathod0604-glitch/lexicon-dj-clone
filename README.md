# lexicon-dj-clone

A neon-inspired DJ deck experience inspired by Lexicon DJ.

## Run locally

Because this is a lightweight front-end prototype, you do not need a build step or package installation.

1. In the project folder, start a static web server:

   ```bash
   python3 -m http.server 8000
   ```

2. Open the app in your browser:

   ```text
   http://localhost:8000
   ```

## Features

- dual-deck DJ interface
- neon studio styling
- play, cue, sync controls
- adjustable master, deck, and crossfader levels
- animated visualizer and vinyl motion
- track library with selectable loops
- drag-and-drop queue reordering
- keyboard shortcuts for deck selection and playback
- generated synth-based audio using the Web Audio API

## Notes

The app uses browser-generated synth tones instead of uploaded audio files so it works immediately without external media assets.

