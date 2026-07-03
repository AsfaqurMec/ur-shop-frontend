import { ArrowRight, Mail } from 'lucide-react';
import { Container } from '@/components/ui';
import { Button } from '@/components/ui';

export function NewsletterSection() {
  return (
    <section className="py-16 md:py-20">
      <Container size="lg">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background border border-border/50 p-8 shadow-lg md:p-12">
          <div className="flex flex-col items-center text-center">
            <Mail className="h-12 w-12 text-primary" />
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Subscribe to Our Newsletter
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Get the latest updates on new products, special offers, and exclusive discounts delivered to your inbox
            </p>
            <form className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button type="submit" className="w-full sm:w-auto">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </section>
  );
}
