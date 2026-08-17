import Link from "next/link";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, LANDING_ROUTES } from "@/lib/landing-routes";
import { Button } from "@/components/ui/button";
import "@/styles/spaces.css";

export const metadata = {
  title: "Démo · Dépannage Express",
  description: "Comptes de démonstration utilisateur, dépanneur et administrateur.",
};

export default function DemoPage() {
  return (
    <div className="demo-page">
      <div className="demo-page__inner">
        <p className="demo-page__eyebrow">Mode démonstration</p>
        <h1 className="demo-page__title">Testez les 3 espaces</h1>
        <p className="demo-page__lead">
          Connexion classique : email + mot de passe.
          Mot de passe commun à tous les comptes démo :{" "}
          <strong>{DEMO_PASSWORD}</strong>
        </p>

        <div className="demo-grid">
          {DEMO_ACCOUNTS.map((account) => (
            <article
              key={account.email}
              className={`demo-card demo-card--${account.role}`}
            >
              <p className="demo-card__role">{account.label}</p>
              <h2 className="demo-card__name">{account.name}</h2>
              <p className="demo-card__desc">{account.description}</p>
              <p className="demo-card__email">
                {account.email}
                <br />
                Mot de passe : {account.password}
              </p>
              <div className="demo-card__actions">
                <Button
                  asChild
                  className={
                    account.role === "pro"
                      ? "bg-[linear-gradient(135deg,#e0231c,#ff5b45)]"
                      : undefined
                  }
                >
                  <Link href={account.loginPath}>Se connecter</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={account.appPath}>Ouvrir l’espace</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>

        <section className="demo-steps">
          <h2>Parcours de test recommandé</h2>
          <ol>
            <li>
              Lancez <code>npm run mongo</code> puis <code>npm run seed</code>{" "}
              et <code>npm run dev</code>.
            </li>
            <li>
              Connectez-vous en <strong>utilisateur</strong>, activez la
              géolocalisation et suivez / créez une panne.
            </li>
            <li>
              Dans un autre navigateur, connectez-vous en{" "}
              <strong>dépanneur</strong>, passez disponible et acceptez la
              mission.
            </li>
            <li>
              Connectez-vous en <strong>admin</strong> pour voir stats et
              interventions.
            </li>
          </ol>
          <p style={{ marginTop: 16 }}>
            <Button variant="ghost" asChild>
              <Link href="/">← Retour à l’accueil</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href={LANDING_ROUTES.clientSignup}>Créer un compte</Link>
            </Button>
          </p>
        </section>
      </div>
    </div>
  );
}
