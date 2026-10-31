import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router'
import { LanguageProvider } from '../shared/i18n/LanguageProvider.tsx'
import { appRouter } from './appRouter.tsx'
import { store } from './store.ts'

export function App() {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <RouterProvider router={appRouter} />
      </LanguageProvider>
    </Provider>
  )
}
