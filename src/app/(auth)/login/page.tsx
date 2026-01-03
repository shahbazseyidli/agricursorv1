"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";

    console.log("[LOGIN] Submitting with:", email);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("[LOGIN] Result:", result);

      if (result?.error) {
        setError("Email və ya şifrə yanlışdır");
      } else if (result?.ok) {
        // Get updated session to check user role
        const session = await getSession();
        const userRole = (session?.user as any)?.role;
        
        console.log("[LOGIN] User role:", userRole);
        
        // Redirect based on role and callbackUrl
        if (userRole === "ADMIN") {
          // Admin users always go to admin panel
          if (callbackUrl?.startsWith("/admin")) {
            router.push(callbackUrl);
          } else {
            router.push("/admin");
          }
        } else {
          // Regular users go to dashboard or callbackUrl (if not admin page)
          if (callbackUrl && !callbackUrl.startsWith("/admin")) {
            router.push(callbackUrl);
          } else {
            router.push("/dashboard");
          }
        }
        router.refresh();
      }
    } catch (err) {
      console.error("[LOGIN] Error:", err);
      setError("Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-900">AgriPrice</span>
          </Link>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Daxil olun</CardTitle>
            <CardDescription>
              Hesabınıza daxil olmaq üçün məlumatlarınızı daxil edin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="sizin@email.az"
                  defaultValue=""
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Şifrə</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    Şifrəni unutdunuz?
                  </Link>
                </div>
                <Input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  defaultValue=""
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gözləyin...
                  </>
                ) : (
                  "Daxil ol"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Hesabınız yoxdur?{" "}
              <Link
                href="/register"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Qeydiyyatdan keçin
              </Link>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-2 font-medium">Demo hesablar:</p>
              <div className="space-y-1 text-xs text-slate-600">
                <p>Admin: admin@agriprice.az / admin123</p>
                <p>User: user@agriprice.az / user123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
