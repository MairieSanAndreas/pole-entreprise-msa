import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./hooks/useToast";
import { Loading } from "./components/ui";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import CompanyForm from "./pages/CompanyForm";
import CompanyDetail from "./pages/CompanyDetail";
import Invoices from "./pages/Invoices";
import Contracts from "./pages/Contracts";
import Links from "./pages/Links";
import Templates from "./pages/Templates";
import MySpace from "./pages/MySpace";
import History from "./pages/History";
import Users from "./pages/Users";
import Settings from "./pages/Settings";

function RequireAuth() {
  const { session, profile, loading } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  // Compte désactivé : bloqué même si la session existe encore.
  if (profile && profile.is_active === false)
    return (
      <div className="auth-wrap">
        <div className="card auth-card center">
          <h1>Compte désactivé</h1>
          <p className="sub">Contactez la responsable du Pôle Entreprise.</p>
        </div>
      </div>
    );
  // Première connexion : changement de mot de passe obligatoire.
  if (profile?.must_change_password) return <ChangePassword forced />;
  return <Layout><Outlet /></Layout>;
}

function RequireResponsable() {
  const { isResponsable, loading } = useAuth();
  if (loading) return <Loading />;
  return isResponsable ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/changer-mot-de-passe" element={<ChangePassword />} />

            <Route element={<RequireAuth />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/entreprises" element={<Companies />} />
              <Route path="/entreprises/nouvelle" element={<CompanyForm />} />
              <Route path="/entreprises/:id" element={<CompanyDetail />} />
              <Route path="/entreprises/:id/modifier" element={<CompanyForm />} />
              <Route path="/factures" element={<Invoices />} />
              <Route path="/contrats" element={<Contracts />} />
              <Route path="/liens" element={<Links />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/mon-espace" element={<MySpace />} />
              <Route path="/historique" element={<History />} />

              <Route element={<RequireResponsable />}>
                <Route path="/utilisateurs" element={<Users />} />
                <Route path="/parametres" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
