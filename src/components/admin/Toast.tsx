'use client';

import { useEffect } from 'react';

interface Props {
  msg: string;
  type: 'success' | 'error';
  onDone: () => void;
}

export default function Toast({ msg, type, onDone }: Props) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [msg, onDone]);

  if (!msg) return null;
  return (
    <div
      role="alert"
      className={`p-4 rounded-lg text-sm font-medium ${
        type === 'error'
          ? 'bg-red-50 border border-red-200 text-red-700'
          : 'bg-green-50 border border-green-200 text-green-700'
      }`}
    >
      {msg}
    </div>
  );
}
