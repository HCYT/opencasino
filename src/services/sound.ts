const sounds: Record<string, string> = {
  deal: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  fold: 'https://assets.mixkit.co/active_storage/sfx/2056/2056-preview.mp3',
  allin: 'https://assets.mixkit.co/active_storage/sfx/1118/1118-preview.mp3',
  mortgage: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  replace: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3'
};

export const playSound = (type: string) => {
  try {
    const src = sounds[type];
    if (!src) return;
    const audio = new Audio(src);
    audio.volume = 0.4;
    audio.play().catch(e => console.warn('Sound Error:', e));
  } catch {
    console.warn('Audio not supported');
  }
};
