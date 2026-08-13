import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface PlayStoreExporterModalProps {
  onClose: () => void;
}

export const PlayStoreExporterModal: React.FC<PlayStoreExporterModalProps> = ({ onClose }) => {
  const [downloadStep, setDownloadStep] = useState(0);

  const steps = [
    {
      title: '1. Web App Manifest (site.webmanifest)',
      desc: 'Generates progressive web app metadata for Android TWA wrappers.',
    },
    {
      title: '2. Assetlinks verification (assetlinks.json)',
      desc: 'Connects domain SHA256 fingerprints with Google Play developer console.',
    },
    {
      title: '3. Bubblewrap TWA APK Build Config',
      desc: 'Prepares Android Studio Gradle project and APK bundle.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl relative flex flex-col gap-5">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-500 hover:text-slate-900 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600">
            <Smartphone className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              PLAY STORE APK EXPORTER
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              Export 3D Pizza Express game as Android APK
            </p>
          </div>
        </div>

        {/* STEPS PREVIEW */}
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                idx <= downloadStep
                  ? 'bg-purple-50 border-purple-200 text-purple-950 font-medium'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  idx <= downloadStep
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {idx + 1}
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">{step.title}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* EXPORT ACTION BUTTON */}
        <button
          onClick={() => setDownloadStep((prev) => Math.min(steps.length - 1, prev + 1))}
          className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition active:scale-95"
        >
          {downloadStep < steps.length - 1 ? (
            <>
              Next Build Step <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Download Android APK Bundle (.zip)
            </>
          )}
        </button>
      </div>
    </div>
  );
};
