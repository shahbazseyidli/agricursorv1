"use client";

import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={closeLoginModal}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="p-8 pb-6 bg-ai text-center">
          <div className="w-16 h-16 rounded-2xl bg-ai-muted border border-ai-border flex items-center justify-center mx-auto mb-4 shadow-ai-glow">
            <Sparkles className="h-8 w-8 text-ai-accent" />
          </div>
          <h2 className="text-2xl font-bold text-ai-foreground mb-2">
            {isSignUp ? 'Hesab yaradın' : 'Xoş gəlmisiniz'}
          </h2>
          <p className="text-ai-foreground/60 text-sm">
            Premium data və AI xüsusiyyətlərinə giriş əldə edin
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="sizin@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Şifrə</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-accent hover:bg-accent/90"
            disabled={isLoading}
          >
            {isLoading ? 'Gözləyin...' : isSignUp ? 'Qeydiyyatdan keç' : 'Daxil ol'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {isSignUp ? 'Artıq hesabınız var?' : 'Hesabınız yoxdur?'}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-1 text-accent hover:underline font-medium"
            >
              {isSignUp ? 'Daxil olun' : 'Qeydiyyat'}
            </button>
          </div>

          {/* Data trust message */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              🔒 Bütün məlumatlarımız real bazar datalarına əsaslanır.
              <br />
              FAO, Eurostat və yerli bazar mənbələrindən toplanır.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

