import { Suspense } from 'react'
import ChatClient from '@/components/ChatClient'

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-void pt-14" />}>
      <ChatClient />
    </Suspense>
  )
}
