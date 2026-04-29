export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex items-center justify-center bg-muted/30 px-4 py-12">
      {children}
    </div>
  );
}
