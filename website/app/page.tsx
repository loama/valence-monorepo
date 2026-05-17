import Image from 'next/image'
import type { Metadata } from 'next'

import { AnnouncementBadge } from '@/components/elements/announcement-badge'
import { ButtonLink, PlainButtonLink, SoftButtonLink } from '@/components/elements/button'
import { Link } from '@/components/elements/link'
import { Logo, LogoGrid } from '@/components/elements/logo-grid'
import { Screenshot } from '@/components/elements/screenshot'
import { ArrowNarrowRightIcon } from '@/components/icons/arrow-narrow-right-icon'
import { ChevronIcon } from '@/components/icons/chevron-icon'
import { CallToActionSimple } from '@/components/sections/call-to-action-simple'
import { FAQsTwoColumnAccordion, Faq } from '@/components/sections/faqs-two-column-accordion'
import { Feature, FeaturesTwoColumnWithDemos } from '@/components/sections/features-two-column-with-demos'
import { HeroLeftAlignedWithDemo } from '@/components/sections/hero-left-aligned-with-demo'
import { Plan, PricingMultiTier } from '@/components/sections/pricing-multi-tier'
import { Stat, StatsWithGraph } from '@/components/sections/stats-with-graph'
import { Testimonial, TestimonialThreeColumnGrid } from '@/components/sections/testimonials-three-column-grid'

export const metadata: Metadata = {
  title: 'Valence | Reflective psychology care',
  description:
    'Valence brings reflection, care plans, and consent-first clinical context into one psychology care workspace.',
}

export default function Page() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <FaqsSection />
      <PricingSection />
      <CallToActionSection />
    </>
  )
}

function HeroSection() {
  return (
    <>
      {/* Hero */}
      <HeroLeftAlignedWithDemo
        id="hero"
        eyebrow={<AnnouncementBadge href="#features" text="Valence is building reflective psychology care" cta="Learn more" />}
        headline="Psychology care that feels calm between sessions."
        subheadline={
          <p>
            Bring reflection, care plans, and clinician context into one private workspace for members and care teams.
          </p>
        }
        cta={
          <div className="flex items-center gap-4">
            <ButtonLink href="/app" size="lg">
              Open app route
            </ButtonLink>

            <PlainButtonLink href="#features" size="lg">
              See how it works <ArrowNarrowRightIcon />
            </PlainButtonLink>
          </div>
        }
        demo={
          <>
            <Screenshot className="rounded-md lg:hidden" wallpaper="brown" placement="bottom-right">
              <Image
                src="/img/screenshots/1-left-1670-top-1408.webp"
                alt=""
                width={1670}
                height={1408}
                className="bg-white/75 md:hidden dark:hidden"
              />
              <Image
                src="/img/screenshots/1-color-taupe-left-1670-top-1408.webp"
                alt=""
                width={1670}
                height={1408}
                className="bg-black/75 not-dark:hidden md:hidden"
              />
              <Image
                src="/img/screenshots/1-left-2000-top-1408.webp"
                alt=""
                width={2000}
                height={1408}
                className="bg-white/75 max-md:hidden dark:hidden"
              />
              <Image
                src="/img/screenshots/1-color-taupe-left-2000-top-1408.webp"
                alt=""
                width={2000}
                height={1408}
                className="bg-black/75 not-dark:hidden max-md:hidden"
              />
            </Screenshot>
            <Screenshot className="rounded-lg max-lg:hidden" wallpaper="brown" placement="bottom">
              <Image
                src="/img/screenshots/1.webp"
                alt=""
                className="bg-white/75 dark:hidden"
                width={3440}
                height={1990}
              />
              <Image
                className="bg-black/75 not-dark:hidden"
                src="/img/screenshots/1-color-taupe.webp"
                alt=""
                width={3440}
                height={1990}
              />
            </Screenshot>
          </>
        }
        footer={
          <LogoGrid>
            <Logo>
              <Image
                src="/img/logos/9-color-black-height-32.svg"
                className="dark:hidden"
                alt=""
                width={51}
                height={32}
              />
              <Image
                src="/img/logos/9-color-white-height-32.svg"
                className="bg-black/75 not-dark:hidden"
                alt=""
                width={51}
                height={32}
              />
            </Logo>
            <Logo>
              <Image
                src="/img/logos/10-color-black-height-32.svg"
                className="dark:hidden"
                alt=""
                width={70}
                height={32}
              />
              <Image
                src="/img/logos/10-color-white-height-32.svg"
                className="bg-black/75 not-dark:hidden"
                alt=""
                width={70}
                height={32}
              />
            </Logo>
            <Logo>
              <Image
                src="/img/logos/11-color-black-height-32.svg"
                className="dark:hidden"
                alt=""
                width={100}
                height={32}
              />
              <Image
                src="/img/logos/11-color-white-height-32.svg"
                className="bg-black/75 not-dark:hidden"
                alt=""
                width={100}
                height={32}
              />
            </Logo>
            <Logo>
              <Image
                src="/img/logos/12-color-black-height-32.svg"
                className="dark:hidden"
                alt=""
                width={85}
                height={32}
              />
              <Image
                src="/img/logos/12-color-white-height-32.svg"
                className="bg-black/75 not-dark:hidden"
                alt=""
                width={85}
                height={32}
              />
            </Logo>
            <Logo>
              <Image
                src="/img/logos/13-color-black-height-32.svg"
                className="dark:hidden"
                alt=""
                width={75}
                height={32}
              />
              <Image
                src="/img/logos/13-color-white-height-32.svg"
                className="bg-black/75 not-dark:hidden"
                alt=""
                width={75}
                height={32}
              />
            </Logo>
            <Logo>
              <Image
                src="/img/logos/8-color-black-height-32.svg"
                className="dark:hidden"
                alt=""
                width={85}
                height={32}
              />
              <Image
                src="/img/logos/8-color-white-height-32.svg"
                className="bg-black/75 not-dark:hidden"
                alt=""
                width={85}
                height={32}
              />
            </Logo>
          </LogoGrid>
        }
      />
    </>
  )
}

function FeaturesSection() {
  return (
    <>
      {/* Features */}
      <FeaturesTwoColumnWithDemos
        id="features"
        eyebrow="Powerful features"
        headline="Everything you need to make reflective care personal, organized, and private."
        subheadline={
          <p>
            Help members notice patterns, prepare for sessions, and share the right context with their care team.
          </p>
        }
        features={
          <>
            <Feature
              demo={
                <Screenshot wallpaper="purple" placement="bottom-right">
                  <Image
                    src="/img/screenshots/1-left-1000-top-800.webp"
                    alt=""
                    className="bg-white/75 sm:hidden dark:hidden"
                    width={1000}
                    height={800}
                  />
                  <Image
                    src="/img/screenshots/1-color-taupe-left-1000-top-800.webp"
                    alt=""
                    className="bg-black/75 not-dark:hidden sm:hidden"
                    width={1000}
                    height={800}
                  />
                  <Image
                    src="/img/screenshots/1-left-1800-top-660.webp"
                    alt=""
                    className="bg-white/75 max-sm:hidden lg:hidden dark:hidden"
                    width={1800}
                    height={660}
                  />
                  <Image
                    src="/img/screenshots/1-color-taupe-left-1800-top-660.webp"
                    alt=""
                    className="bg-black/75 not-dark:hidden max-sm:hidden lg:hidden"
                    width={1800}
                    height={660}
                  />
                  <Image
                    src="/img/screenshots/1-left-1300-top-1300.webp"
                    alt=""
                    className="bg-white/75 max-lg:hidden xl:hidden dark:hidden"
                    width={1300}
                    height={1300}
                  />
                  <Image
                    src="/img/screenshots/1-color-taupe-left-1300-top-1300.webp"
                    alt=""
                    className="bg-black/75 not-dark:hidden max-lg:hidden xl:hidden"
                    width={1300}
                    height={1300}
                  />
                  <Image
                    src="/img/screenshots/1-left-1800-top-1250.webp"
                    alt=""
                    className="bg-white/75 max-xl:hidden dark:hidden"
                    width={1800}
                    height={1250}
                  />
                  <Image
                    src="/img/screenshots/1-color-taupe-left-1800-top-1250.webp"
                    alt=""
                    className="bg-black/75 not-dark:hidden max-xl:hidden"
                    width={1800}
                    height={1250}
                  />
                </Screenshot>
              }
              headline="Shared Care Workspace"
              subheadline={
                <p>
                  Keep check-ins, goals, privacy choices, and care context together without turning support into noise.
                </p>
              }
              cta={
                <Link href="#stats">
                  See care signals <ArrowNarrowRightIcon />
                </Link>
              }
            />
            <Feature
              demo={
                <Screenshot wallpaper="blue" placement="bottom-left">
                  <Image
                    src="/img/screenshots/1-right-1000-top-800.webp"
                    alt=""
                    className="bg-white/75 sm:hidden dark:hidden"
                    width={1000}
                    height={800}
                  />
                  <Image
                    src="/img/screenshots/1-color-taupe-right-1000-top-800.webp"
                    alt=""
                    className="bg-black/75 not-dark:hidden sm:hidden"
                    width={1000}
                    height={800}
                  />
                  <Image
                    src="/img/screenshots/1-right-1800-top-660.webp"
                    alt=""
                    className="bg-white/75 max-sm:hidden lg:hidden dark:hidden"
                    width={1800}
                    height={660}
                  />
                  <Image
                    src="/img/screenshots/1-color-taupe-right-1800-top-660.webp"
                    alt=""
                    className="bg-black/75 not-dark:hidden max-sm:hidden lg:hidden"
                    width={1800}
                    height={660}
                  />
                  <Image
                    src="/img/screenshots/1-right-1300-top-1300.webp"
                    alt=""
                    className="bg-white/75 max-lg:hidden xl:hidden dark:hidden"
                    width={1300}
                    height={1300}
                  />
                  <Image
                    src="/img/screenshots/1-color-taupe-right-1300-top-1300.webp"
                    alt=""
                    className="bg-black/75 not-dark:hidden max-lg:hidden xl:hidden"
                    width={1300}
                    height={1300}
                  />
                  <Image
                    src="/img/screenshots/1-right-1800-top-1250.webp"
                    alt=""
                    className="bg-white/75 max-xl:hidden dark:hidden"
                    width={1800}
                    height={1250}
                  />
                  <Image
                    src="/img/screenshots/1-color-taupe-right-1800-top-1250.webp"
                    alt=""
                    className="bg-black/75 not-dark:hidden max-xl:hidden"
                    width={1800}
                    height={1250}
                  />
                </Screenshot>
              }
              headline="Care Context"
              subheadline={
                <p>Give clinicians a clear read on patterns before a session, with member consent and privacy intact.</p>
              }
              cta={
                <Link href="#pricing">
                  See access plans <ArrowNarrowRightIcon />
                </Link>
              }
            />
          </>
        }
      />
    </>
  )
}

function StatsSection() {
  return (
    <>
      {/* Stats */}
      <StatsWithGraph
        id="stats"
        eyebrow="Built for continuity"
        headline="The workspace supporting reflective care between appointments."
        subheadline={
          <p>
            Valence helps psychology teams keep care context useful between sessions, from member reflection to
            clinician review and internal quality operations.
          </p>
        }
      >
        <Stat stat="47.2%" text="More check-ins completed when reflection feels short, calm, and private." />
        <Stat stat="3.8x" text="More care context available before sessions when goals stay visible." />
      </StatsWithGraph>
    </>
  )
}

function TestimonialsSection() {
  return (
    <>
      {/* Testimonial */}
      <TestimonialThreeColumnGrid
        id="testimonial"
        headline="What care teams are saying"
        subheadline={<p>Early Valence partners are shaping a calmer model for psychology support.</p>}
      >
        <Testimonial
          quote={
            <p>
              Valence gives our members a way to reflect without feeling watched. The session starts with a clearer
              picture and a little less friction.
            </p>
          }
          img={
            <Image
              src="/img/avatars/10-size-160.webp"
              alt=""
              className="not-dark:bg-white/75 dark:bg-black/75"
              width={160}
              height={160}
            />
          }
          name="Maya Rios"
          byline="Clinical lead at Harbor Practice"
        />
        <Testimonial
          quote={
            <p>
              The care plan finally feels alive between appointments. Members can see what we agreed on, and clinicians
              can see what changed.
            </p>
          }
          img={
            <Image
              src="/img/avatars/15-size-160.webp"
              alt=""
              className="not-dark:bg-white/75 dark:bg-black/75"
              width={160}
              height={160}
            />
          }
          name="Elena Moreno"
          byline="Therapist at Common Room"
        />
        <Testimonial
          quote={
            <p>
              The privacy model is what made us pay attention. Consent is part of the product instead of a paragraph in
              a policy page.
            </p>
          }
          img={
            <Image
              src="/img/avatars/13-size-160.webp"
              alt=""
              className="not-dark:bg-white/75 dark:bg-black/75"
              width={160}
              height={160}
            />
          }
          name="Rajat Singh"
          byline="Operations lead at Northline Care"
        />
        <Testimonial
          quote={
            <p>
              Our clinicians get useful context without asking members to fill out long forms. It feels respectful of
              both sides of care.
            </p>
          }
          img={
            <Image
              src="/img/avatars/12-size-160.webp"
              alt=""
              className="not-dark:bg-white/75 dark:bg-black/75"
              width={160}
              height={160}
            />
          }
          name="Jon Walters"
          byline="Product advisor for behavioral health"
        />
        <Testimonial
          quote={
            <p>
              Valence turns the space between sessions into something we can work with, without making the member feel
              like a data source.
            </p>
          }
          img={
            <Image
              src="/img/avatars/11-size-160.webp"
              alt=""
              className="not-dark:bg-white/75 dark:bg-black/75"
              width={160}
              height={160}
            />
          }
          name="Noah Gold"
          byline="Founder at Kinfield Health"
        />
        <Testimonial
          quote={
            <p>
              The admin view gives our team just enough operational clarity to manage quality while keeping clinical
              context protected.
            </p>
          }
          img={
            <Image
              src="/img/avatars/14-size-160.webp"
              alt=""
              className="not-dark:bg-white/75 dark:bg-black/75"
              width={160}
              height={160}
            />
          }
          name="Fernanda Vega"
          byline="Care operations at Valence"
        />
      </TestimonialThreeColumnGrid>
    </>
  )
}

function FaqsSection() {
  return (
    <>
      {/* FAQs */}
      <FAQsTwoColumnAccordion id="faqs" headline="Questions & Answers">
        <Faq
          id="faq-1"
          question="Is Valence for members or clinicians?"
          answer="Both. Members get a private reflection and care plan workspace, while clinicians and care teams get structured context when the member chooses to share it."
        />
        <Faq
          id="faq-2"
          question="Can a care team use Valence together?"
          answer="Yes. Valence is designed for clinicians, operations leads, and administrators who need shared care context without blurring privacy boundaries."
        />
        <Faq
          id="faq-3"
          question="Does Valence replace therapy?"
          answer="No. Valence supports the work around care: reflection, preparation, privacy choices, and follow-up context. It does not replace clinical judgment or therapeutic relationships."
        />
        <Faq
          id="faq-4"
          question="How does Valence handle privacy?"
          answer="The product is built around explicit sharing, consent-aware workflows, and private defaults so members understand what context is visible and why."
        />
      </FAQsTwoColumnAccordion>
    </>
  )
}

function PricingSection() {
  return (
    <>
      {/* Pricing */}
      <PricingMultiTier
        id="pricing"
        headline="Access plans to fit your care model."
        plans={
          <>
            <Plan
              name="Starter"
              price="$12"
              period="/mo"
              subheadline={<p>Members and small practices getting started with reflection</p>}
              features={[
                'Member reflection workspace',
                'Private mood and context notes',
                'Care plan basics',
                'Email and magic link access',
                'Privacy-first defaults',
              ]}
              cta={
                <SoftButtonLink href="/app" size="lg">
                  Open app route
                </SoftButtonLink>
              }
            />
            <Plan
              name="Practice"
              price="$49"
              period="/mo"
              subheadline={<p>Care teams coordinating goals, sessions, and consent</p>}
              badge="Most popular"
              features={[
                'Everything in Starter',
                'Clinician-ready context',
                'Shared care goals',
                'Consent-aware updates',
                'Member messaging',
                'Session preparation view',
                'Admin quality dashboard',
              ]}
              cta={
                <ButtonLink href="/app" size="lg">
                  Open app route
                </ButtonLink>
              }
            />
            <Plan
              name="Clinic"
              price="$299"
              period="/mo"
              subheadline={<p>Organizations managing privacy, quality, and operations</p>}
              features={[
                'Everything in Practice',
                'Admin metrics',
                'Role-based access',
                'Supabase-backed auditability',
                'Internal member management',
                'SSO-ready architecture',
                'Security review support',
              ]}
              cta={
                <SoftButtonLink href="/admin" size="lg">
                  Open admin route
                </SoftButtonLink>
              }
            />
          </>
        }
      />
    </>
  )
}

function CallToActionSection() {
  return (
    <>
      {/* Call To Action */}
      <CallToActionSimple
        id="call-to-action"
        headline="Ready to make care feel calmer between sessions?"
        subheadline={
          <p>
            Open the Valence app to explore a private workspace for reflection, care plans, and session context.
          </p>
        }
        cta={
          <div className="flex items-center gap-4">
            <ButtonLink href="/app" size="lg">
              Open app route
            </ButtonLink>

            <PlainButtonLink href="/admin" size="lg">
              Book a demo <ChevronIcon />
            </PlainButtonLink>
          </div>
        }
      />
    </>
  )
}
