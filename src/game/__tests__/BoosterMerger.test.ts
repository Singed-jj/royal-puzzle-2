import { describe, it, expect } from 'vitest';
import { BoosterMerger } from '../BoosterMerger';
import { BoosterType, MergeType } from '../types';

describe('BoosterMerger', () => {
  const merger = new BoosterMerger();

  it('Rocket + Rocket → Cross', () => {
    expect(merger.getMergeType(BoosterType.HorizontalRocket, BoosterType.VerticalRocket)).toBe(MergeType.Cross);
    expect(merger.getMergeType(BoosterType.HorizontalRocket, BoosterType.HorizontalRocket)).toBe(MergeType.Cross);
  });

  it('TNT + TNT → MegaExplosion', () => {
    expect(merger.getMergeType(BoosterType.TNT, BoosterType.TNT)).toBe(MergeType.MegaExplosion);
  });

  it('LightBall + LightBall → AllBoardExplosion', () => {
    expect(merger.getMergeType(BoosterType.LightBall, BoosterType.LightBall)).toBe(MergeType.AllBoardExplosion);
  });

  it('TNT + Rocket → BigRocket', () => {
    expect(merger.getMergeType(BoosterType.TNT, BoosterType.HorizontalRocket)).toBe(MergeType.BigRocket);
  });

  it('LightBall + Rocket → AllToRocket', () => {
    expect(merger.getMergeType(BoosterType.LightBall, BoosterType.HorizontalRocket)).toBe(MergeType.AllToRocket);
  });

  it('순서 무관', () => {
    const a = merger.getMergeType(BoosterType.TNT, BoosterType.HorizontalRocket);
    const b = merger.getMergeType(BoosterType.HorizontalRocket, BoosterType.TNT);
    expect(a).toBe(b);
  });
});
