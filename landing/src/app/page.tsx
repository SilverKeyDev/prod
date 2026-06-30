import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import DemoPreview from '@/components/DemoPreview'
import Partners from '@/components/Partners'
import InfoSection from '@/components/InfoSection'
import SavingsCalculator from '@/components/SavingsCalculator'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import FinalCTA from '@/components/FinalCTA'
import Footer from '@/components/Footer'
import StickyBar from '@/components/StickyBar'

function SecDivider() {
  return (
    <div
      style={{
        width: '100%',
        height: 1,
        background: 'linear-gradient(to right, transparent, rgba(61,20,3,.15) 30%, rgba(61,20,3,.15) 70%, transparent)',
      }}
    />
  )
}

export default function Page() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 58 }}>
        <Hero />
        <DemoPreview />
        <SecDivider />
        <Partners />
        <SecDivider />
        <InfoSection />
        <SecDivider />
        <SavingsCalculator />
        <SecDivider />
        <Pricing />
        <SecDivider />
        <FAQ />
        <SecDivider />
        <FinalCTA />
      </main>
      <Footer />
      <StickyBar />
    </>
  )
}
