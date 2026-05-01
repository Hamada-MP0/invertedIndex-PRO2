import { useState } from 'react';
import Hero from './components/Hero';
import VoiceModal from './components/VoiceModal';

function App() {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#050505]">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,90,31,0.12),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(255,90,31,0.08),_transparent_40%),linear-gradient(to_bottom,#050505,#0a0a0a,#050505)]" />

        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,90,31,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,90,31,0.12)_1px,transparent_1px)] bg-[size:80px_80px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,90,31,0.03)_50%,transparent_100%)] bg-[length:100%_8px] animate-pulse opacity-30" />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-[#ff5a1f]/10 blur-[140px]" />
      </div>

      {/* Hero */}
      <Hero onVoiceClick={() => setIsVoiceModalOpen(true)} />

      {/* Voice Modal */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}

export default App;