import { BoosterType, MergeType } from './types';

type BoosterCategory = 'rocket' | 'tnt' | 'lightball' | 'missile';

function categorize(b: BoosterType): BoosterCategory | null {
  if (b === BoosterType.HorizontalRocket || b === BoosterType.VerticalRocket) return 'rocket';
  if (b === BoosterType.TNT) return 'tnt';
  if (b === BoosterType.LightBall) return 'lightball';
  if (b === BoosterType.Missile) return 'missile';
  return null;
}

// Keys are alphabetically sorted pairs
const MERGE_MAP: Record<string, MergeType> = {
  'lightball_lightball': MergeType.AllBoardExplosion,
  'lightball_missile': MergeType.AllToMissile,
  'lightball_rocket': MergeType.AllToRocket,
  'lightball_tnt': MergeType.AllToTNT,
  'missile_missile': MergeType.TripleMissile,
  'missile_rocket': MergeType.MissileRocket,
  'missile_tnt': MergeType.MissileTNT,
  'rocket_rocket': MergeType.Cross,
  'rocket_tnt': MergeType.BigRocket,
  'tnt_tnt': MergeType.MegaExplosion,
};

export class BoosterMerger {
  getMergeType(a: BoosterType, b: BoosterType): MergeType {
    const catA = categorize(a);
    const catB = categorize(b);
    if (!catA || !catB) return MergeType.None;

    const sorted = [catA, catB].sort();
    const key = `${sorted[0]}_${sorted[1]}`;
    return MERGE_MAP[key] ?? MergeType.None;
  }
}
