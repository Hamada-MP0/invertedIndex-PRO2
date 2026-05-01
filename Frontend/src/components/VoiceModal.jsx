export default function VoiceModal({ isOpen, onClose }) {
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-500 ease-out ${
        isOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
      }`}
    >
      {/* Modal Card */}
      <div 
        className={`relative w-full max-w-2xl mx-4 bg-black/70 backdrop-blur-md border border-[#61dca3]/40 rounded-lg p-12 flex flex-col items-center shadow-[0_0_50px_rgba(97,220,163,0.2)] transition-all duration-500 delay-75 ease-out ${
          isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        {/* Premium Edge Highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-[#61dca3]/80 to-transparent"></div>
        
        {/* Status */}
        <div className="flex items-center gap-3 mb-stack-lg">
          <span className="material-symbols-outlined text-[#61dca3] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
          <span className="font-mono text-sm text-[#61dca3] uppercase tracking-[0.2em] animate-pulse">Listening...</span>
        </div>
        
        {/* High-End Waveform Animation (Static CSS Representation) */}
        <div className="flex items-center justify-center gap-2 h-24 mb-stack-lg w-full max-w-xs">
          <div className="w-3 h-8 bg-[#61dca3]/40 rounded-sm"></div>
          <div className="w-3 h-14 bg-[#61dca3]/60 rounded-sm"></div>
          <div className="w-3 h-20 bg-[#61dca3]/80 rounded-sm shadow-[0_0_10px_rgba(97,220,163,0.4)]"></div>
          <div className="w-3 h-24 bg-[#61dca3] rounded-sm shadow-[0_0_20px_rgba(97,220,163,0.8)]"></div>
          <div className="w-3 h-16 bg-[#61dca3]/70 rounded-sm shadow-[0_0_10px_rgba(97,220,163,0.4)]"></div>
          <div className="w-3 h-10 bg-[#61dca3]/50 rounded-sm"></div>
          <div className="w-3 h-6 bg-[#61dca3]/30 rounded-sm"></div>
        </div>
        
        {/* Live Transcription */}
        <p className="font-mono text-lg text-center text-[#c4c5d7] leading-relaxed max-w-lg">
          &gt; extracting_entities: <span className="text-[#61dca3] bg-[#61dca3]/10 px-2 py-0.5 rounded border border-[#61dca3]/30">"chamomile exporters"</span> location: <span className="text-[#61b3dc] bg-[#61b3dc]/10 px-2 py-0.5 rounded border border-[#61b3dc]/30">"Egypt"</span><span className="animate-pulse">_</span>
        </p>
        
        {/* Close / Cancel Action */}
        <button 
          onClick={onClose}
          className="mt-12 w-12 h-12 rounded-md border border-[#61dca3]/40 flex items-center justify-center text-[#61dca3]/70 hover:bg-[#61dca3]/20 hover:text-[#61dca3] hover:border-[#61dca3] transition-all cursor-pointer shadow-[0_0_15px_rgba(97,220,163,0.1)] hover:shadow-[0_0_20px_rgba(97,220,163,0.3)]"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
}
