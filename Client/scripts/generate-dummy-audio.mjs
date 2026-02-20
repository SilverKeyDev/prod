#!/usr/bin/env node
/**
 * Generates minimal WAV audio files for feed placeholders.
 * - dummy-audio-speech.wav: short "speech-like" tone (for video items)
 * - dummy-audio-song.wav: longer tone (for image-only items)
 */
import { writeFileSync } from "fs";
import { join } from "path";

const SAMPLE_RATE = 44100;
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 1;

function createWavBuffer(durationSeconds, frequency = 440) {
  const numSamples = Math.floor(SAMPLE_RATE * durationSeconds * NUM_CHANNELS);
  const byteRate = SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const dataSize = numSamples * (BITS_PER_SAMPLE / 8);

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  const write = (buf) => {
    buf.copy(buffer, offset);
    offset += buf.length;
  };

  write(Buffer.from("RIFF", "ascii"));
  buffer.writeUInt32LE(36 + dataSize, 4);
  write(Buffer.from("WAVE", "ascii"));
  write(Buffer.from("fmt ", "ascii"));
  buffer.writeUInt32LE(16, offset);
  offset += 4;
  buffer.writeUInt16LE(1, offset);
  offset += 2;
  buffer.writeUInt16LE(NUM_CHANNELS, offset);
  offset += 2;
  buffer.writeUInt32LE(SAMPLE_RATE, offset);
  offset += 4;
  buffer.writeUInt32LE(byteRate, offset);
  offset += 4;
  buffer.writeUInt16LE(blockAlign, offset);
  offset += 2;
  buffer.writeUInt16LE(BITS_PER_SAMPLE, offset);
  offset += 2;
  write(Buffer.from("data", "ascii"));
  buffer.writeUInt32LE(dataSize, offset);
  offset += 4;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.3;
    const intSample = Math.max(
      -32768,
      Math.min(32767, Math.floor(sample * 32767)),
    );
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

const publicDir = join(process.cwd(), "public");
writeFileSync(
  join(publicDir, "dummy-audio-speech.wav"),
  createWavBuffer(5, 220),
);
writeFileSync(
  join(publicDir, "dummy-audio-song.wav"),
  createWavBuffer(30, 440),
);
console.log("Created dummy-audio-speech.wav and dummy-audio-song.wav");
