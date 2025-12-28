'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BrainCircuit, Search, Filter, Sparkles, Target, Database, X } from 'lucide-react';

interface StepIconTooltipProps {
  stepName: string;
  input: any;
  output: any;
  reasoning?: string;
}

const getStepIcon = (name: string) => {
  if (name.includes('keyword')) return <BrainCircuit className="h-5 w-5 text-inch-worm" />;
  if (name.includes('search')) return <Search className="h-5 w-5 text-inch-worm" />;
  if (name.includes('filter')) return <Filter className="h-5 w-5 text-inch-worm" />;
  if (name.includes('relevance')) return <Sparkles className="h-5 w-5 text-inch-worm" />;
  if (name.includes('select') || name.includes('rank')) return <Target className="h-5 w-5 text-inch-worm" />;
  return <Database className="h-5 w-5 text-white/60" />;
};

type PositionType = 'top' | 'center' | 'bottom';

export function StepIconTooltip({ stepName, input, output, reasoning }: StepIconTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{top: number, left: number, arrowTop: number, posType: PositionType} | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxLifespanRef = useRef<NodeJS.Timeout | null>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Force close the tooltip
  const closeTooltip = useCallback(() => {
    setIsOpen(false);
    setPosition(null);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (maxLifespanRef.current) {
      clearTimeout(maxLifespanRef.current);
      maxLifespanRef.current = null;
    }
  }, []);

  // Clear hide timeout only
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Schedule hiding with delay
  const scheduleHide = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      closeTooltip();
    }, 800);
  }, [clearHideTimeout, closeTooltip]);

  // Open the tooltip
  const openTooltip = useCallback(() => {
    clearHideTimeout();
    setIsOpen(true);
    
    if (maxLifespanRef.current) {
      clearTimeout(maxLifespanRef.current);
    }
    maxLifespanRef.current = setTimeout(() => {
      closeTooltip();
    }, 10000);
  }, [clearHideTimeout, closeTooltip]);

  // Handle icon click (toggle)
  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      closeTooltip();
    } else {
      openTooltip();
    }
  };

  // Handle icon mouse enter
  const handleIconMouseEnter = () => {
    clearHideTimeout();
    if (!isOpen) {
      openTooltip();
    }
  };

  // Handle icon mouse leave
  const handleIconMouseLeave = () => {
    scheduleHide();
  };

  // Handle tooltip mouse enter/leave
  const handleTooltipMouseEnter = () => clearHideTimeout();
  const handleTooltipMouseLeave = () => scheduleHide();

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const iconCenterY = rect.top + rect.height / 2;
      const viewportHeight = window.innerHeight;
      
      const HEADER_HEIGHT = 120; // Increased to clear sticky header
      const BOTTOM_PADDING = 20;
      const TOOLTIP_HEIGHT = 300;
      
      let tooltipTop: number;
      let arrowTop: number;
      let posType: PositionType;
      
      // Determine which zone the icon is in
      if (iconCenterY < HEADER_HEIGHT + 100) {
        // TOP ZONE: Icon is near the top
        // Position tooltip starting below the header area
        posType = 'top';
        tooltipTop = HEADER_HEIGHT;
        arrowTop = Math.max(20, iconCenterY - tooltipTop);
      } else if (iconCenterY > viewportHeight - 200) {
        // BOTTOM ZONE: Icon is near the bottom
        // Position tooltip so its bottom is near the icon, arrow points to icon
        posType = 'bottom';
        tooltipTop = Math.max(HEADER_HEIGHT, iconCenterY - TOOLTIP_HEIGHT + 50);
        arrowTop = iconCenterY - tooltipTop;
      } else {
        // CENTER ZONE: Normal centering
        posType = 'center';
        tooltipTop = iconCenterY - TOOLTIP_HEIGHT / 2;
        // Clamp to valid range
        tooltipTop = Math.max(HEADER_HEIGHT, Math.min(tooltipTop, viewportHeight - TOOLTIP_HEIGHT - BOTTOM_PADDING));
        arrowTop = iconCenterY - tooltipTop;
      }
      
      // Clamp arrow position to stay within tooltip bounds
      arrowTop = Math.max(20, Math.min(arrowTop, TOOLTIP_HEIGHT - 20));
      
      setPosition({
        left: rect.right + 16,
        top: tooltipTop,
        arrowTop: arrowTop,
        posType: posType
      });
    }
  }, [isOpen]);

  // Close on page scroll (but not internal tooltip scroll)
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e: Event) => {
      if (tooltipRef.current?.contains(e.target as Node)) return;
      closeTooltip();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen, closeTooltip]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTooltip();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeTooltip]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!iconRef.current?.contains(target) && !tooltipRef.current?.contains(target)) {
        closeTooltip();
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeTooltip]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (maxLifespanRef.current) clearTimeout(maxLifespanRef.current);
    };
  }, []);

  const rawData = {
    step: stepName,
    input: input,
    output: output,
    ...(reasoning && { reasoning })
  };

  return (
    <div className="relative">
      <div
        ref={iconRef}
        className="bg-background border border-inch-worm/20 p-2 rounded-full shadow-lg cursor-pointer transition-all duration-200 hover:scale-110 hover:border-inch-worm/50 hover:shadow-inch-worm/20 hover:shadow-lg"
        onClick={handleIconClick}
        onMouseEnter={handleIconMouseEnter}
        onMouseLeave={handleIconMouseLeave}
      >
        {getStepIcon(stepName)}
      </div>

      {/* Tooltip */}
      {isOpen && position && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] w-[380px] max-w-[85vw] animate-in fade-in slide-in-from-left-2 duration-200"
          style={{
            left: position.left,
            top: position.top,
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          {/* Arrow */}
          <div 
            className="absolute left-0 -translate-x-full -translate-y-1/2 pointer-events-none"
            style={{ 
              top: position.arrowTop,
              filter: 'drop-shadow(2px 0 2px rgba(0,0,0,0.3))' 
            }}
          >
            <div className="w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-mosque-dark" />
          </div>
          
          {/* Tooltip Content */}
          <div className="bg-mosque-dark border border-inch-worm/30 rounded-xl shadow-2xl shadow-black/50 overflow-hidden max-h-[300px] flex flex-col">
            {/* Header */}
            <div className="bg-inch-worm/10 px-4 py-2 border-b border-inch-worm/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-inch-worm" />
                <span className="text-xs font-bold text-inch-worm uppercase tracking-wider">Raw Step Data</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/50 truncate max-w-[120px]">{stepName}</span>
                <button 
                  onClick={closeTooltip}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  title="Close (Esc)"
                >
                  <X className="h-3 w-3 text-white/50 hover:text-white" />
                </button>
              </div>
            </div>
            
            {/* JSON Content - scrollable */}
            <div 
              className="p-4 overflow-y-auto flex-1 custom-scrollbar"
              onScroll={(e) => e.stopPropagation()}
            >
              <pre className="text-xs text-white/80 font-mono whitespace-pre-wrap break-words leading-relaxed">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
