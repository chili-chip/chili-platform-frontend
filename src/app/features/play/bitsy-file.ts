interface CitsyPlayer {
  start: (canvas: HTMLCanvasElement, gameData: string) => void;
  stop: () => void;
  isActive: () => boolean;
}

declare global {
  interface Window {
    CitsyPlayer?: CitsyPlayer;
  }
}

let loading: Promise<CitsyPlayer> | null = null;

export function downloadBitsy(slug: string, data: string): void {
  const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slug || 'game'}.bitsy`;
  link.click();
  URL.revokeObjectURL(url);
}

export function loadCitsyPlayer(): Promise<CitsyPlayer> {
  if (window.CitsyPlayer) {
    return Promise.resolve(window.CitsyPlayer);
  }
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/creator/citsy/citsy-player.js';
      script.onload = () => {
        if (window.CitsyPlayer) {
          resolve(window.CitsyPlayer);
          return;
        }
        reject(new Error('The player did not load.'));
      };
      script.onerror = () => reject(new Error('The player did not load.'));
      document.body.appendChild(script);
    });
  }
  return loading;
}
