import { useToastStore } from '../store/useToastStore';

const ICONS = {
  success: '✅',
  error: '⚠️',
  info: 'ℹ️',
};

const COLORS = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-800 text-white',
};

export default function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-[min(90vw,28rem)]">
      {toasts.map((item) => (
        <div
          onClick={() => dismiss(item.id)}
          className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-fadeIn-down cursor-pointer ${COLORS[item.kind] || COLORS.info}`}
          role="status"
          key={item.id}
        >
          <span className="text-lg leading-none">
            {ICONS[item.kind] || ICONS.info}
          </span>
          <span className="flex-1">{item.message}</span>
        </div>
      ))}
    </div>
  );
}
