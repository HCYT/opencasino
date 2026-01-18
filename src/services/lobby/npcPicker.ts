import { NPCProfile } from '../../types';

export const pickEligibleNPC = (npcProfiles: NPCProfile[], exclude: string[]): NPCProfile | undefined => {
  const available = npcProfiles.filter(profile => !exclude.includes(profile.name));
  if (available.length === 0) return undefined;
  return available[Math.floor(Math.random() * available.length)];
};

export const pickNpcTriplet = (npcProfiles: NPCProfile[]): [NPCProfile, NPCProfile, NPCProfile] => {
  // Ensure we have at least 3 NPCs to pick from
  if (npcProfiles.length < 3) {
    console.warn('Not enough NPC profiles available, need at least 3');
    // Fallback: duplicate profiles if needed
    while (npcProfiles.length < 3) {
      npcProfiles = [...npcProfiles, ...npcProfiles];
    }
  }

  const first = pickEligibleNPC(npcProfiles, []);
  if (!first) {
    console.error('Failed to pick first NPC, using fallback');
    return [npcProfiles[0], npcProfiles[1 % npcProfiles.length], npcProfiles[2 % npcProfiles.length]];
  }

  const second = pickEligibleNPC(npcProfiles, [first.name]);
  if (!second) {
    console.error('Failed to pick second NPC, using fallback');
    return [first, npcProfiles.find(p => p.name !== first.name) || first, npcProfiles[0]];
  }

  const third = pickEligibleNPC(npcProfiles, [first.name, second.name]);
  if (!third) {
    console.error('Failed to pick third NPC, using fallback');
    return [first, second, npcProfiles.find(p => p.name !== first.name && p.name !== second.name) || first];
  }

  return [first, second, third];
};
