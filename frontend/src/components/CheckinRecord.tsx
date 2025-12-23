/**
 * 簽到記錄顯示組件
 */
import { useState, useEffect } from 'react';
import type { Checkin, Event } from '../types';

interface CheckinRecordProps {
  checkin: Checkin | null;
  event: Event;
}

export default function CheckinRecord({
  checkin,
  event
}: CheckinRecordProps) {
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!checkin || !event.require_checkout || checkin.checkout_time) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      let targetTime: Date | null = null;

      // 計算目標時間
      if (event.checkout_mode === 'after_duration' && event.checkout_duration) {
        const checkinTime = new Date(checkin.checkin_time);
        targetTime = new Date(checkinTime.getTime() + event.checkout_duration * 60 * 1000);
      } else if (event.checkout_mode === 'at_end_time') {
        targetTime = new Date(event.end_time);
      }

      if (!targetTime) {
        return;
      }

      const diff = targetTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('可以簽退了');
        return;
      }

      // 計算倒數時間
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours} 小時 ${minutes} 分鐘 ${seconds} 秒`);
      } else if (minutes > 0) {
        setCountdown(`${minutes} 分鐘 ${seconds} 秒`);
      } else {
        setCountdown(`${seconds} 秒`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [checkin, event]);

  if (!checkin) {
    return null;
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">簽到記錄</h3>

      {/* 簽到時間 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">簽到時間：</span>
          <span className="text-sm text-gray-900">{formatTime(checkin.checkin_time)}</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-xs text-green-600">已簽到</span>
        </div>
      </div>

      {/* 簽退時間 */}
      {checkin.checkout_time ? (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">簽退時間：</span>
            <span className="text-sm text-gray-900">{formatTime(checkin.checkout_time)}</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-xs text-blue-600">已簽退</span>
          </div>
        </div>
      ) : event.require_checkout ? (
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-xs text-yellow-600">等待簽退</span>
          </div>

          {/* 倒數計時 */}
          {countdown && countdown !== '可以簽退了' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800 text-center">
                {event.checkout_mode === 'after_duration'
                  ? `簽到後 ${event.checkout_duration} 分鐘可簽退`
                  : '活動結束時間到才能簽退'}
              </p>
              <p className="text-sm font-semibold text-yellow-900 text-center mt-1">
                剩餘時間：{countdown}
              </p>
            </div>
          )}

          {countdown === '可以簽退了' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-green-900 text-center">
                ✓ 現在可以簽退了，請使用下方簽退按鈕
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
