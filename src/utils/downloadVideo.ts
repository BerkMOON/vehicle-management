import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const FFMPEG_CORE_BASE =
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

export const isMpegTsSource = (videoUrl: string, videoPath?: string) => {
  const check = (s: string) => /\.ts($|\?|#)/i.test(s);
  return check(videoUrl) || (!!videoPath && check(videoPath));
};

export const isMp4Source = (videoUrl: string, videoPath?: string) => {
  const check = (s: string) => /\.mp4($|\?|#)/i.test(s);
  return check(videoUrl) || (!!videoPath && check(videoPath));
};

function getBaseName(videoPath?: string, clueId?: string) {
  const fromPath = (videoPath || '').split('/').pop()?.split('?')[0] || '';
  if (fromPath) return fromPath;
  if (clueId) return `${clueId}.mp4`;
  return 'video.mp4';
}

export function getVideoDownloadFileName(videoPath?: string, clueId?: string) {
  const baseName = getBaseName(videoPath, clueId);
  if (/\.ts$/i.test(baseName)) {
    return baseName.replace(/\.ts$/i, '.mp4');
  }
  if (/\.mp4$/i.test(baseName)) {
    return baseName;
  }
  return `${baseName}.mp4`;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance;
  }
  if (!loadPromise) {
    loadPromise = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${FFMPEG_CORE_BASE}/ffmpeg-core.js`,
          'text/javascript',
        ),
        wasmURL: await toBlobURL(
          `${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`,
          'application/wasm',
        ),
      });
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    })().catch((error) => {
      loadPromise = null;
      throw error;
    });
  }
  return loadPromise;
}

async function convertTsToMp4(tsBlob: Blob): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const inputName = 'input.ts';
  const outputName = 'output.mp4';

  await ffmpeg.writeFile(inputName, await fetchFile(tsBlob));
  const exitCode = await ffmpeg.exec([
    '-i',
    inputName,
    '-c',
    'copy',
    '-bsf:a',
    'aac_adtstoasc',
    '-movflags',
    '+faststart',
    outputName,
  ]);

  if (exitCode !== 0) {
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    throw new Error('TS 转 MP4 失败');
  }

  const data = await ffmpeg.readFile(outputName);
  await Promise.all([
    ffmpeg.deleteFile(inputName).catch(() => undefined),
    ffmpeg.deleteFile(outputName).catch(() => undefined),
  ]);

  const bytes =
    data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
  return new Blob([bytes], { type: 'video/mp4' });
}

/**
 * 下载视频：mp4 直接下载；ts 先转为 mp4 再下载。
 */
export async function downloadVideoAsMp4(options: {
  videoUrl: string;
  videoPath?: string;
  clueId?: string;
}) {
  const { videoUrl, videoPath, clueId } = options;
  const filename = getVideoDownloadFileName(videoPath, clueId);
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error('视频下载失败，请检查网络或链接是否过期');
  }

  const sourceBlob = await response.blob();
  if (isMpegTsSource(videoUrl, videoPath)) {
    const mp4Blob = await convertTsToMp4(sourceBlob);
    triggerBlobDownload(mp4Blob, filename);
    return;
  }

  triggerBlobDownload(sourceBlob, filename);
}
