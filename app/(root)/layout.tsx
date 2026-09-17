import StreamVideoProvider from '@/providers/StreamClientProvider'
import ConvexClientProvider from '@/components/ConvexClientProvider'
import { ReactNode } from 'react'

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main>
      <ConvexClientProvider>
        <StreamVideoProvider>{children}</StreamVideoProvider>
      </ConvexClientProvider>
    </main>
  )
}

export default RootLayout