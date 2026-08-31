/**
 * AI Voice Debate Player Engine
 *
 * Provides high-fidelity multi-persona voice playback for debate turns:
 * 1. Fetches backend-synthesized audio via POST /api/voice/synthesize
 * 2. In-memory caching (Map<turnId, objectUrl>) to avoid redundant network calls
 * 3. Speculative prefetching of turn (i + 1) while turn i is playing
 * 4. Graceful fallback to browser SpeechSynthesis if backend audio is unavailable
 * 5. Full playback controls (Play, Pause, Resume, Stop, Replay Turn, Skip Turn, Restart)
 */

import type { AgentId, DebateTurn } from '../types';
import { API_BASE } from './agents';

export type VoicePlayerStatus = 'idle' | 'synthesizing' | 'playing' | 'paused' | 'completed' | 'error';

export interface VoicePlayerState {
  status: VoicePlayerStatus;
  currentTurnIndex: number;
  currentTurn: DebateTurn | null;
  totalTurns: number;
  activeSpeaker: AgentId | null;
  isPlaying: boolean;
  isPaused: boolean;
  error: string | null;
}

const NOVELTY_VOICE_NAMES = [
  'bad news',
  'bahh',
  'bells',
  'boing',
  'bubbles',
  'cellos',
  'deranged',
  'good news',
  'hysterical',
  'pipe organ',
  'trinoids',
  'whisper',
  'wobble',
  'zarvox',
  'albert',
  'fred',
  'junior',
  'kathy',
  'princess',
  'ralph',
  'organ',
  'jester',
];

export function isNaturalHumanVoice(voice: SpeechSynthesisVoice): boolean {
  if (!voice.lang || !voice.lang.toLowerCase().startsWith('en')) {
    return false;
  }
  const nameLower = voice.name.toLowerCase();
  for (const novelty of NOVELTY_VOICE_NAMES) {
    if (nameLower.includes(novelty)) {
      return false;
    }
  }
  return true;
}

export function getCleanEnglishVoices(allVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const natural = allVoices.filter(isNaturalHumanVoice);
  if (natural.length > 0) return natural;

  // Fallback: at least filter English
  const english = allVoices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  return english.length > 0 ? english : allVoices;
}

export function selectPersonaVoice(
  allVoices: SpeechSynthesisVoice[],
  persona: AgentId
): SpeechSynthesisVoice | null {
  if (!allVoices || allVoices.length === 0) return null;

  const cleanVoices = getCleanEnglishVoices(allVoices);
  if (cleanVoices.length === 0) return allVoices[0] || null;

  const findByName = (patterns: string[]): SpeechSynthesisVoice | undefined => {
    for (const pat of patterns) {
      const found = cleanVoices.find((v) => v.name.toLowerCase().includes(pat.toLowerCase()));
      if (found) return found;
    }
    return undefined;
  };

  switch (persona) {
    case 'culture':
      // Warm, empathetic natural voice
      return (
        findByName(['Samantha', 'Victoria', 'Karen', 'Moira', 'Tessa', 'Fiona', 'Zira', 'Female', 'Google US English']) ||
        cleanVoices[1 % cleanVoices.length] ||
        cleanVoices[0]
      );

    case 'technical':
      // Clear, analytical voice
      return (
        findByName(['Alex', 'Daniel', 'Tom', 'Oliver', 'David', 'Mark', 'Male', 'Google UK English Male']) ||
        cleanVoices[0]
      );

    case 'hiring_manager':
      // Authoritative, executive voice
      return (
        findByName(['Arthur', 'Rishi', 'Aaron', 'Gordon', 'David', 'George', 'Google US English']) ||
        cleanVoices[2 % cleanVoices.length] ||
        cleanVoices[0]
      );

    case 'skeptic':
      // Probing, sharp voice
      return (
        findByName(['Daniel', 'Karen', 'Serena', 'Oliver', 'Google UK English Female']) ||
        cleanVoices[3 % cleanVoices.length] ||
        cleanVoices[0]
      );

    default:
      return cleanVoices[0];
  }
}

const PERSONA_SPEECH_CONFIG: Record<AgentId, { pitch: number; rate: number }> = {
  technical: { pitch: 1.0, rate: 1.02 },
  culture: { pitch: 1.05, rate: 0.98 },
  hiring_manager: { pitch: 0.98, rate: 1.0 },
  skeptic: { pitch: 1.02, rate: 1.04 },
};

export class VoiceDebateEngine {
  private audioCache = new Map<string, string>(); // turn.id -> audio Blob URL
  private prefetchQueue = new Set<string>();
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private turns: DebateTurn[] = [];
  private currentIndex = -1;
  private state: VoicePlayerState = {
    status: 'idle',
    currentTurnIndex: -1,
    currentTurn: null,
    totalTurns: 0,
    activeSpeaker: null,
    isPlaying: false,
    isPaused: false,
    error: null,
  };
  private listeners = new Set<(state: VoicePlayerState) => void>();
  private onTurnRevealed?: (turnIndex: number) => void;

  constructor(onTurnRevealed?: (turnIndex: number) => void) {
    this.onTurnRevealed = onTurnRevealed;
  }

  public subscribe(listener: (state: VoicePlayerState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const copy = { ...this.state };
    this.listeners.forEach((l) => l(copy));
  }

  public setTurns(turns: DebateTurn[]) {
    this.turns = turns;
    this.state.totalTurns = turns.length;
    if (this.currentIndex >= turns.length) {
      this.currentIndex = turns.length - 1;
    }
    this.notify();
  }

  /**
   * Synthesize audio for a turn via backend endpoint.
   * Returns a local object URL or null if fallback to browser speech is needed.
   */
  public async fetchTurnAudio(turn: DebateTurn): Promise<string | null> {
    if (this.audioCache.has(turn.id)) {
      return this.audioCache.get(turn.id)!;
    }

    try {
      const response = await fetch(`${API_BASE}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: turn.fromAgent,
          text: turn.content,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('audio/')) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        this.audioCache.set(turn.id, objectUrl);
        return objectUrl;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Prefetch turn (i + 1) audio in background
   */
  public prefetchNextTurn(index: number) {
    const nextTurn = this.turns[index + 1];
    if (nextTurn && !this.audioCache.has(nextTurn.id) && !this.prefetchQueue.has(nextTurn.id)) {
      this.prefetchQueue.add(nextTurn.id);
      this.fetchTurnAudio(nextTurn)
        .catch(() => {})
        .finally(() => this.prefetchQueue.delete(nextTurn.id));
    }
  }

  /**
   * Start or resume playing from the current or specified index
   */
  public async play(fromIndex?: number) {
    if (this.turns.length === 0) return;

    if (this.state.isPaused && this.currentAudio && fromIndex === undefined) {
      this.currentAudio.play();
      this.state.status = 'playing';
      this.state.isPlaying = true;
      this.state.isPaused = false;
      this.notify();
      return;
    }

    if (this.state.isPaused && typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.state.status = 'playing';
      this.state.isPlaying = true;
      this.state.isPaused = false;
      this.notify();
      return;
    }

    const targetIndex = fromIndex !== undefined ? fromIndex : (this.currentIndex < 0 ? 0 : this.currentIndex);
    await this.playTurn(targetIndex);
  }

  private async playTurn(index: number) {
    if (index < 0 || index >= this.turns.length) {
      this.state.status = 'completed';
      this.state.isPlaying = false;
      this.state.isPaused = false;
      this.state.currentTurn = null;
      this.state.activeSpeaker = null;
      this.notify();
      return;
    }

    this.stopCurrentMedia();
    this.currentIndex = index;
    const turn = this.turns[index];

    this.state.status = 'synthesizing';
    this.state.currentTurnIndex = index;
    this.state.currentTurn = turn;
    this.state.activeSpeaker = turn.fromAgent;
    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.notify();

    if (this.onTurnRevealed) {
      this.onTurnRevealed(index + 1);
    }

    // Speculatively prefetch next turn while synthesizing/playing current
    this.prefetchNextTurn(index);

    const audioUrl = await this.fetchTurnAudio(turn);

    // If active playback was stopped or changed while fetching
    if (this.currentIndex !== index || !this.state.isPlaying) {
      return;
    }

    if (audioUrl) {
      this.playNativeAudio(audioUrl, index);
    } else {
      this.playBrowserSpeech(turn, index);
    }
  }

  private playNativeAudio(url: string, index: number) {
    try {
      const audio = new Audio(url);
      this.currentAudio = audio;
      this.state.status = 'playing';
      this.notify();

      audio.onended = () => {
        if (this.currentIndex === index && this.state.isPlaying) {
          this.playTurn(index + 1);
        }
      };

      audio.onerror = () => {
        // Fallback to speech synthesis if audio element errors
        const turn = this.turns[index];
        if (turn) this.playBrowserSpeech(turn, index);
      };

      audio.play().catch(() => {
        const turn = this.turns[index];
        if (turn) this.playBrowserSpeech(turn, index);
      });
    } catch {
      const turn = this.turns[index];
      if (turn) this.playBrowserSpeech(turn, index);
    }
  }

  private playBrowserSpeech(turn: DebateTurn, index: number) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      // If speech synthesis not supported, automatically advance
      setTimeout(() => {
        if (this.currentIndex === index && this.state.isPlaying) {
          this.playTurn(index + 1);
        }
      }, 1500);
      return;
    }

    window.speechSynthesis.cancel();
    const config = PERSONA_SPEECH_CONFIG[turn.fromAgent] || { pitch: 1.0, rate: 1.0 };
    const utterance = new SpeechSynthesisUtterance(turn.content);
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const selected = selectPersonaVoice(voices, turn.fromAgent);
      if (selected) {
        utterance.voice = selected;
      }
    }

    utterance.onend = () => {
      if (this.currentIndex === index && this.state.isPlaying) {
        this.playTurn(index + 1);
      }
    };

    utterance.onerror = () => {
      if (this.currentIndex === index && this.state.isPlaying) {
        this.playTurn(index + 1);
      }
    };

    this.currentUtterance = utterance;
    this.state.status = 'playing';
    this.notify();
    window.speechSynthesis.speak(utterance);
  }

  public pause() {
    if (!this.state.isPlaying) return;

    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }

    this.state.status = 'paused';
    this.state.isPlaying = false;
    this.state.isPaused = true;
    this.notify();
  }

  public replayCurrentTurn() {
    if (this.currentIndex >= 0) {
      this.playTurn(this.currentIndex);
    }
  }

  public skipTurn() {
    if (this.currentIndex + 1 < this.turns.length) {
      this.playTurn(this.currentIndex + 1);
    } else {
      this.stop();
    }
  }

  public restart() {
    this.playTurn(0);
  }

  public stop() {
    this.stopCurrentMedia();
    this.currentIndex = -1;
    this.state.status = 'idle';
    this.state.currentTurnIndex = -1;
    this.state.currentTurn = null;
    this.state.activeSpeaker = null;
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.notify();
  }

  private stopCurrentMedia() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public destroy() {
    this.stop();
    this.audioCache.forEach((url) => URL.revokeObjectURL(url));
    this.audioCache.clear();
    this.listeners.clear();
  }
}
