import { cn } from "@/lib/utils";

interface FeatureToggleProps {
  label: string;
  icon: string;
  enabled: boolean;
  color: string;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

/**
 * Feature Toggle Component
 * @description Animated toggle switch for enabling/disabling features
 */
export function FeatureToggle({ 
  label, 
  icon, 
  enabled, 
  color, 
  onChange,
  disabled = false
}: FeatureToggleProps) {
  
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 bg-slate-50 rounded-lg transition-colors",
        disabled 
          ? "cursor-not-allowed opacity-50" 
          : "cursor-pointer hover:bg-slate-100"
      )}
      onClick={() => !disabled && onChange(!enabled)}
      data-testid={`feature-toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-lg">{icon}</span>
        <span className={cn(
          "text-sm font-medium",
          disabled ? "text-slate-400" : "text-slate-700"
        )}>{label}</span>
      </div>
      
      {/* Toggle Switch */}
      <div 
        className={cn(
          "w-10 h-5 rounded-full relative transition-colors duration-200",
          disabled 
            ? "bg-slate-200" 
            : enabled 
              ? color 
              : "bg-slate-300"
        )}
      >
        <div 
          className={cn(
            "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200",
            enabled ? "right-0.5" : "left-0.5"
          )}
        />
      </div>
    </div>
  );
}
