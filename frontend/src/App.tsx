import { Auth0Provider } from "@auth0/auth0-react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import NavBar from "./components/NavBar"
import ProtectedRoute from "./components/ProtectedRoute"
import Explorar from "./pages/Explorar"
import Horario from "./pages/Horario"
import Landing from "./pages/Landing"
import Perfil from "./pages/Perfil"

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const audience = import.meta.env.VITE_AUTH0_AUDIENCE

function App() {
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
      }}
    >
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <NavBar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/explorar" element={<Explorar />} />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <Perfil />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/horario"
                element={
                  <ProtectedRoute>
                    <Horario />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </Auth0Provider>
  )
}

export default App
