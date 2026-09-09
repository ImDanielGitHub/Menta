export type ProofMediaType = 'photo' | 'video' | 'text';
export type CameraProofMediaType = Exclude<ProofMediaType, 'text'>;

export const isProofMediaType = (value: unknown): value is ProofMediaType =>
  value === 'photo' || value === 'video' || value === 'text';
