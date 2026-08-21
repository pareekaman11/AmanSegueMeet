import { GuestGuard } from "@/components/auth/guest-guard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md">
          {/* Branding placeholder */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SegueMeet</h1>
            <p className="text-muted-foreground mt-2">Board management, simplified.</p>
          </div>
          
          {/* Card Container */}
          <div className="bg-white border rounded-xl shadow-sm p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
