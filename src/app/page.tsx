import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  MapPin,
  Package,
  ArrowRight,
  Leaf,
  Globe,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: TrendingUp,
    title: "Real-vaxt qiymət izləmə",
    description:
      "Kənd təsərrüfatı məhsullarının qiymətlərini həftəlik və aylıq izləyin",
  },
  {
    icon: BarChart3,
    title: "Müqayisəli analiz",
    description:
      "Bazarlar və məhsullar arasında qiymət müqayisəsi aparın",
  },
  {
    icon: MapPin,
    title: "Bazar xəritəsi",
    description:
      "Azərbaycanın müxtəlif bölgələrindəki bazarları kəşf edin",
  },
  {
    icon: Package,
    title: "Məhsul kataloqu",
    description: "100+ kənd təsərrüfatı məhsulu haqqında detallı məlumat",
  },
];

const stats = [
  { value: "100+", label: "Məhsul" },
  { value: "50+", label: "Bazar" },
  { value: "27", label: "EU Ölkə" },
  { value: "8000+", label: "Qiymət qeydi" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">
                AgriPrice
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/products"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Məhsullar
              </Link>
              <Link
                href="/markets"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Bazarlar
              </Link>
              <Link
                href="/countries"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Ölkələr
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Dashboard
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/login">Daxil ol</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Qeydiyyat</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-emerald-700 text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              Azərbaycan Kənd Təsərrüfatı Qiymət Platforması
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Kənd təsərrüfatı{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
                qiymətlərini
              </span>{" "}
              izləyin
          </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Azərbaycanda kənd təsərrüfatı məhsullarının real-vaxt qiymət
              monitorinqi, analizi və müqayisəsi üçün peşəkar platforma
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/products">
                  Məhsulları kəşf et
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">Dashboard-a keç</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-emerald-600 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Platforma imkanları
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              AgriPrice sizə kənd təsərrüfatı bazarını anlamaq və qərarlar
              qəbul etmək üçün lazım olan bütün alətləri təqdim edir
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                    <feature.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-12 text-center text-white">
            <Shield className="w-12 h-12 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl font-bold mb-4">
              Etibarlı məlumat, dəqiq qərarlar
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              agro.gov.az rəsmi mənbəsindən alınan məlumatlar əsasında
              hazırlanmış qiymət analizi platforması
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-emerald-700 hover:bg-slate-50"
              asChild
            >
              <Link href="/register">
                Pulsuz qeydiyyat
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">AgriPrice</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/about" className="hover:text-slate-700">
                Haqqımızda
              </Link>
              <Link href="/contact" className="hover:text-slate-700">
                Əlaqə
              </Link>
              <Link href="/privacy" className="hover:text-slate-700">
                Məxfilik
              </Link>
            </div>
            <div className="text-sm text-slate-400">
              © 2026 AgriPrice. Bütün hüquqlar qorunur.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
