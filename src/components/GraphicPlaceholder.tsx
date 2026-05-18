const GraphicPlaceholder = ({ label, className = "" }: { label: string; className?: string }) => (
  <div className={`graphic-placeholder graphic-placeholder-pulse p-8 min-h-[120px] ${className}`}>
    <div className="text-center">
      <p className="text-sm font-medium text-primary/60">📐 {label}</p>
      <p className="text-xs text-primary/40 mt-1">Visual coming soon</p>
    </div>
  </div>
);

export default GraphicPlaceholder;
