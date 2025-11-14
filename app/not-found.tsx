"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Home,
  ArrowLeft,
  Search,
  FileQuestion,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const quickLinks = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      description: "Go to home",
    },
    {
      title: "Work Orders",
      href: "/dashboard/workorders",
      icon: Wrench,
      description: "View work orders",
    },
    {
      title: "Projects",
      href: "/dashboard/projects",
      icon: FileQuestion,
      description: "View projects",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Animated 404 */}
        <div className="relative">
          <h1
            className={`text-[150px] font-black leading-none text-primary/10 transition-all duration-1000 sm:text-[200px] ${
              mounted ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          >
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <FileQuestion
              className={`h-24 w-24 text-primary transition-all duration-1000 delay-300 sm:h-32 sm:w-32 ${
                mounted ? "scale-100 opacity-100" : "scale-0 opacity-0"
              }`}
            />
          </div>
        </div>

        {/* Message */}
        <div
          className={`space-y-4 transition-all duration-1000 delay-500 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground">
            Sorry, the page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div
          className={`flex flex-col justify-center gap-3 sm:flex-row transition-all duration-1000 delay-700 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <div
          className={`pt-8 transition-all duration-1000 delay-1000 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <Search className="h-5 w-5" />
                Quick Links
              </CardTitle>
              <CardDescription>
                Maybe this is what you were looking for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href}>
                      <Card className="transition-all hover:border-primary hover:shadow-md">
                        <CardContent className="flex flex-col items-center gap-2 p-4">
                          <Icon className="h-8 w-8 text-primary" />
                          <div className="space-y-1 text-center">
                            <p className="font-medium">{link.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {link.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="justify-center text-sm text-muted-foreground">
              Need help? Contact the system administrator
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
