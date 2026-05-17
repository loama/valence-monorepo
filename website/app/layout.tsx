import Image from 'next/image'
import { Familjen_Grotesk, Inter } from 'next/font/google'

import { ButtonLink, PlainButtonLink } from '@/components/elements/button'
import { Main } from '@/components/elements/main'
import { GitHubIcon } from '@/components/icons/social/github-icon'
import { XIcon } from '@/components/icons/social/x-icon'
import { YouTubeIcon } from '@/components/icons/social/youtube-icon'
import {
  FooterCategory,
  FooterLink,
  FooterWithNewsletterFormCategoriesAndSocialIcons,
  NewsletterForm,
  SocialLink,
} from '@/components/sections/footer-with-newsletter-form-categories-and-social-icons'
import {
  NavbarLink,
  NavbarLogo,
  NavbarWithLinksActionsAndCenteredLogo,
} from '@/components/sections/navbar-with-links-actions-and-centered-logo'
import type { Metadata } from 'next'
import './globals.css'

const familjen = Familjen_Grotesk({
  subsets: ['latin'],
  variable: '--font-familjen-grotesk',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Valence',
  description: 'A psychology platform for reflective care, care plans, and consent-first clinical context.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${familjen.variable} ${inter.variable}`}>
      <body>
        <>
          <NavbarWithLinksActionsAndCenteredLogo
            id="navbar"
            links={
              <>
                <NavbarLink href="#pricing">Pricing</NavbarLink>
                <NavbarLink href="#stats">Outcomes</NavbarLink>
                <NavbarLink href="#features">Platform</NavbarLink>
                <NavbarLink href="/app" className="sm:hidden">
                  Log in
                </NavbarLink>
              </>
            }
            logo={
              <NavbarLogo href="/">
                <Image
                  src="/img/logos/valence-wordmark-taupe-950.svg"
                  alt="Valence"
                  className="dark:hidden"
                  width={96}
                  height={28}
                />
                <Image
                  src="/img/logos/valence-wordmark-white.svg"
                  alt="Valence"
                  className="not-dark:hidden"
                  width={96}
                  height={28}
                />
              </NavbarLogo>
            }
            actions={
              <>
                <PlainButtonLink href="/app" className="max-sm:hidden">
                  Log in
                </PlainButtonLink>
                <ButtonLink href="/app">Get started</ButtonLink>
              </>
            }
          />

          <Main>{children}</Main>

          <FooterWithNewsletterFormCategoriesAndSocialIcons
            id="footer"
            cta={
              <NewsletterForm
                headline="Stay in the loop"
                subheadline={
                  <p>
                    Get care design notes, privacy updates and Valence product stories for psychology teams.
                  </p>
                }
                action="#"
              />
            }
            links={
              <>
                <FooterCategory title="Product">
                  <FooterLink href="#features">Features</FooterLink>
                  <FooterLink href="#pricing">Pricing</FooterLink>
                  <FooterLink href="/app">Member app</FooterLink>
                </FooterCategory>
                <FooterCategory title="Company">
                  <FooterLink href="#stats">Outcomes</FooterLink>
                  <FooterLink href="#testimonial">Stories</FooterLink>
                  <FooterLink href="#faqs">Questions</FooterLink>
                  <FooterLink href="/admin">Admin</FooterLink>
                </FooterCategory>
                <FooterCategory title="Resources">
                  <FooterLink href="#features">Care plans</FooterLink>
                  <FooterLink href="#features">Reflection</FooterLink>
                  <FooterLink href="#stats">Quality signals</FooterLink>
                  <FooterLink href="#call-to-action">Contact</FooterLink>
                </FooterCategory>
                <FooterCategory title="Legal">
                  <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
                  <FooterLink href="#faqs">Terms of Service</FooterLink>
                  <FooterLink href="#faqs">Security</FooterLink>
                </FooterCategory>
              </>
            }
            fineprint="Copyright 2026 Valence, Inc."
            socialLinks={
              <>
                <SocialLink href="https://x.com" name="X">
                  <XIcon />
                </SocialLink>
                <SocialLink href="https://github.com" name="GitHub">
                  <GitHubIcon />
                </SocialLink>
                <SocialLink href="https://www.youtube.com" name="YouTube">
                  <YouTubeIcon />
                </SocialLink>
              </>
            }
          />
        </>
      </body>
    </html>
  )
}
