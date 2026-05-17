import { Button } from "@/components/ui/button";

export default function AppHome() {
  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col justify-center gap-8">
        <div className="space-y-5">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Valence App
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
            Hello from the Valence psychology platform app.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            This Next.js, Capacitor, and shadcn workspace is ready for the
            authenticated product experience at the `/app` route.
          </p>
        </div>
        <Button className="w-fit">Open app hello world</Button>
      </section>
    </main>
  );
}
