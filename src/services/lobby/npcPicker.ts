import { NPCProfile } from '../../types';

export const pickEligibleNPC = (npcProfiles: NPCProfile[], exclude: string[]) => {
  const available = npcProfiles.filter(profile => !exclude.includes(profile.name));
  return available[Math.floor(Math.random() * available.length)];
};

export const pickNpcTriplet = (npcProfiles: NPCProfile[]) => {
  const first = pickEligibleNPC(npcProfiles, []);
  const second = pickEligibleNPC(npcProfiles, [first.name]);
  const third = pickEligibleNPC(npcProfiles, [first.name, second.name]);
  return [first, second, third] as const;
};
