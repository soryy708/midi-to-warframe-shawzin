# MIDI to Warframe Shawzin

Convert [MIDI files](https://en.wikipedia.org/wiki/MIDI) to [Warframe Shawzin Transcription Notation](https://warframe.fandom.com/wiki/Shawzin#Song_Transcription) on the Web

Hosted on GitHub Pages: https://soryy708.github.io/midi-to-warframe-shawzin/index.html

---

# How does it work?

1. The user selects a midi file from their local file system
2. The file is converted to JSON (in the browser) using the [midi-json-parser](https://www.npmjs.com/package/midi-json-parser) package
3. The file is analyzed, and the user gets an opportuniy to select a track if there are multiple
4. The system attempts to fit the selected track on to the Shawzin, but transposing the melody and looking for a match to one of Shawzin's scales
5. The melody is converted to the Shawzin Transcription Notation, and displayed to the user

# Contributing

To be able to build the build artifacts, you'll need NodeJS (LTS version) and NPM installed.

After which, run `npm install` to install the project's dependencies.

After which, you can run `npm run build` to build the source code under the `src/` directory. The build artifacts will be stored at the `build/dev/` directory.
You can make it automatically rebuild as files change by running `npm run watch` instead.
