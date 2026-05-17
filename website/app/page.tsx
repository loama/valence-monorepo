import { Button } from "@/components/ui/button";

export default function WebsiteHome() {
  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center gap-8">
        <div className="space-y-5">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Valence Website
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
            Hello from Valence, the psychology platform.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            This Next.js and shadcn workspace is ready for the public website at
            the default route.
          </p>
        </div>
        <form action="/app" method="get">
          <Button className="w-fit" type="submit">
            Open app route
          </Button>
        </form>
      </section>
    </main>
  );
}
