import { Alert, message } from 'antd';
import mpegts from 'mpegts.js';
import { type FC, useEffect, useRef } from 'react';

export type MpegTsVideoPlayerProps = {
  url: string;
  className?: string;
};

/**
 * 裸 MPEG-TS（.ts）在多数浏览器中无法被原生 video 标签解码，需经 mpegts.js 走 MSE。
 * 跨域地址需在服务端配置 CORS，否则拉流会失败。
 */
const MpegTsVideoPlayer: FC<MpegTsVideoPlayerProps> = ({ url, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const supported =
    typeof window !== 'undefined' &&
    mpegts.isSupported() &&
    mpegts.getFeatureList().msePlayback;

  useEffect(() => {
    if (!supported || !url) return;
    const media = videoRef.current;
    if (!media) return;

    const player = mpegts.createPlayer(
      {
        type: 'mpegts',
        isLive: false,
        url,
        cors: true,
      },
      { enableWorker: false },
    );

    const onError = () => {
      message.error(
        'TS 视频加载失败：请确认地址可访问，且视频域已配置 CORS（Access-Control-Allow-Origin）',
      );
    };

    player.on(mpegts.Events.ERROR, onError);
    player.attachMediaElement(media);
    player.load();

    return () => {
      player.off(mpegts.Events.ERROR, onError);
      player.destroy();
    };
  }, [supported, url]);

  if (!supported) {
    return (
      <Alert
        showIcon
        type="warning"
        message="当前环境无法通过 MSE 播放裸 TS"
        description="请使用 Chrome / Edge / Firefox，或较新的桌面 Safari；iOS 需较新版本且对跨域 TS 仍可能受限。也可由服务端转为 MP4 或提供带 CORS 的直链。"
      />
    );
  }

  return (
    <video
      key={url}
      ref={videoRef}
      className={className}
      controls
      playsInline
    />
  );
};

export default MpegTsVideoPlayer;
