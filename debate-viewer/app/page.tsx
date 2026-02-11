"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DebateConfig } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [config, setConfig] = useState<DebateConfig | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    fetch("/api/messages")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data.config || null);
        setMessageCount(data.messages?.length || 0);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <main className="w-full max-w-lg p-8">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          討論会ビューワー
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Claude Code チーム討論をリアルタイムで視聴
        </p>

        {config && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
            <h2 className="text-lg font-bold text-white mb-3">
              {config.topic}
            </h2>

            <div className="space-y-2 mb-4">
              {config.participants.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-sm text-gray-300">
                    {p.displayName}
                  </span>
                  <span className="text-xs text-gray-600">
                    ({p.role})
                  </span>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-500">
              制限時間: {Math.floor(config.duration / 60)}分 | メッセージ: {messageCount}件
            </div>
          </div>
        )}

        <button
          onClick={() => router.push("/debate")}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-lg"
        >
          討論を視聴する
        </button>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            debate-data/config.json で討論設定を変更できます
          </p>
        </div>
      </main>
    </div>
  );
}
