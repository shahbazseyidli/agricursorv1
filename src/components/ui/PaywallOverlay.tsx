"use client";

import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface PaywallOverlayProps {
  title?: string;
  description?: string;
  showPreview?: boolean;
  children?: React.ReactNode;
}

export function PaywallOverlay({ 
  title = 'Premium Məzmun',
  description = 'Bu məlumatlara giriş üçün hesabınıza daxil olun',
  showPreview = true,
  children
}: PaywallOverlayProps) {
  const { openLoginModal } = useAuth();

  return (
    <div className="relative">
      {/* Blurred content preview */}
      {showPreview && children && (
        <div className="blur-md select-none pointer-events-none opacity-50">
          {children}
        </div>
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background via-background/80 to-transparent">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-ai border border-ai-border flex items-center justify-center mx-auto mb-4 shadow-ai-glow">
            <Lock className="h-7 w-7 text-ai-accent" />
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm mb-6">{description}</p>
          
          <Button onClick={openLoginModal} className="bg-accent hover:bg-accent/90">
            <Sparkles className="h-4 w-4 mr-2" />
            Daxil ol / Qeydiyyat
          </Button>

          <p className="mt-4 text-xs text-muted-foreground">
            ✓ Real-time bazar qiymətləri<br />
            ✓ AI analizləri və proqnozlar<br />
            ✓ 50+ ölkənin dataları
          </p>
        </div>
      </div>
    </div>
  );
}

