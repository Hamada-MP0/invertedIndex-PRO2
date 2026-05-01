export default function Background() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
      
      <div className="absolute w-[800px] h-[800px] rounded-full bg-primary-container/10 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="absolute w-[600px] h-[600px] rounded-full bg-tertiary-container/10 blur-[100px] top-1/3 left-1/3"></div>
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent bg-[length:24px_24px]"></div>
    </div>
  );
}
