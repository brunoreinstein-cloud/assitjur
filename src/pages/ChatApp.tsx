import React from 'react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { Composer } from '@/components/chat/Composer';
import { MessageList } from '@/components/chat/MessageList';
import { RightPanel } from '@/components/chat/RightPanel';
import { Toasts } from '@/components/chat/Toasts';

export default function ChatApp() {
  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <ChatHeader />
      
      {/* Main Content - 3 column layout */}
      <div className="flex-1 flex min-h-0">
        {/* Central Column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Input Area */}
          <div className="border-b bg-card/50 backdrop-blur-sm flex-shrink-0">
            <div className="container mx-auto px-6 py-4">
              <Composer />
            </div>
          </div>
          
          {/* Conversation Area */}
          <div className="flex-1 min-h-0">
            <MessageList />
          </div>
        </div>
        
        {/* Right Panel */}
        <div className="hidden lg:block">
          <RightPanel />
        </div>
      </div>
      
      {/* Toast notifications */}
      <Toasts />
    </div>
  );
}