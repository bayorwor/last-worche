import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router'
import { appRouter } from './appRouter.tsx'
import { store } from './store.ts'

export function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={appRouter} />
    </Provider>
  )
}
