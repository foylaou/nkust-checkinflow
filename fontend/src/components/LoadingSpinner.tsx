/**
 * 載入中動畫組件
 */
export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg',
  }[size];

  return (
    <div className="flex justify-center items-center">
      <span className={`loading loading-spinner ${sizeClass}`}></span>
    </div>
  );
}
