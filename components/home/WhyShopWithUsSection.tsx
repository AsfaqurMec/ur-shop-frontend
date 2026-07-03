import { Clock, Headphones, Shield, Truck } from 'lucide-react';
import { Container } from '@/components/ui';
import { SectionHeading } from './SectionHeading';

const whyShopWithUs = [
  { icon: <Truck className="h-8 w-8" />, title: 'Instant Delivery', description: 'Get your digital products immediately after purchase' },
  { icon: <Shield className="h-8 w-8" />, title: 'Secure Payments', description: 'Protected transactions with industry-standard encryption' },
  { icon: <Headphones className="h-8 w-8" />, title: '24/7 Support', description: 'Dedicated support team ready to assist you' },
  { icon: <Clock className="h-8 w-8" />, title: 'Lifetime Access', description: 'Download your purchases anytime, anywhere' },
];

export function WhyShopWithUsSection() {
  return (
    <section className="bg-gradient-to-br from-primary/5 via-background to-background py-16 md:py-20">
      <Container size="lg">
        <SectionHeading
          eyebrow="Benefits"
          title="Why Shop With Us"
          description="Experience the best digital shopping experience with these benefits"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whyShopWithUs.map((item) => (
            <div
              key={item.title}
              className="group rounded-xl border border-border bg-card p-6 text-center transition-all hover:shadow-lg hover:border-primary/20"
            >
              <div className="mb-4 inline-flex rounded-full bg-primary/10 p-4 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
