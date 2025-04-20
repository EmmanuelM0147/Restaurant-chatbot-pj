import React from 'react';
import { Layout } from './components/Layout';
import { ChatContainer } from './components/chat/ChatContainer';
import { SupabaseProvider } from './context/SupabaseContext';
import { OrderProvider } from './context/OrderContext';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';

function App() {
  return (
    <SupabaseProvider>
      <SessionProvider>
        <AuthProvider>
          <OrderProvider>
            <Layout>
              <ChatContainer />
            </Layout>
          </OrderProvider>
        </AuthProvider>
      </SessionProvider>
    </SupabaseProvider>
  );
}

export default App;