import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { AppProvider } from './contexts/AppContext';
import { router } from './routes';

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--card-foreground)',
            borderRadius: '12px',
          },
        }}
      />
    </AppProvider>
  );
}
