"use client";

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-ai text-ai-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-ai-muted flex items-center justify-center">
                <span className="text-ai-accent font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl">Agrai</span>
            </div>
            <p className="text-sm text-ai-foreground/70">
              AI-powered agricultural intelligence for smarter decisions.
            </p>
          </div>
          
          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-sm text-ai-foreground/70">
              <li><Link href="/products" className="hover:text-ai-accent transition-colors">All Products</Link></li>
              <li><Link href="/products/wheat" className="hover:text-ai-accent transition-colors">Grains</Link></li>
              <li><Link href="/products/tomato" className="hover:text-ai-accent transition-colors">Vegetables</Link></li>
              <li><Link href="/products/apple" className="hover:text-ai-accent transition-colors">Fruits</Link></li>
            </ul>
          </div>
          
          {/* Countries */}
          <div>
            <h4 className="font-semibold mb-4">Regions</h4>
            <ul className="space-y-2 text-sm text-ai-foreground/70">
              <li><Link href="/countries" className="hover:text-ai-accent transition-colors">All Countries</Link></li>
              <li><Link href="/countries/azerbaijan" className="hover:text-ai-accent transition-colors">Caucasus</Link></li>
              <li><Link href="/countries/turkey" className="hover:text-ai-accent transition-colors">Middle East</Link></li>
              <li><Link href="/countries/ukraine" className="hover:text-ai-accent transition-colors">Eastern Europe</Link></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-ai-foreground/70">
              <li><Link href="/data-sources" className="hover:text-ai-accent transition-colors">Data Sources</Link></li>
              <li><a href="#" className="hover:text-ai-accent transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-ai-accent transition-colors">Methodology</a></li>
              <li><a href="#" className="hover:text-ai-accent transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-ai-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-ai-foreground/50">
            © 2024 Agrai. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-ai-foreground/50">
            <a href="#" className="hover:text-ai-accent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-ai-accent transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

