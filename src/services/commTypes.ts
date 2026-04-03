/**
 * commTypes.ts — Shared payload types for communication API stubs.
 * Replace with actual request/response schemas when backend is connected.
 */
import { CommChannel } from '../types';

export interface SendMessagePayload {
  content: string;
  channel: CommChannel;
  attachments?: { name: string; type: string; size: string }[];
  templateId?: string;
}
