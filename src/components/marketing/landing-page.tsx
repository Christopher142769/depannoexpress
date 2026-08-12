"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import "@/styles/landing.css";
import { useLandingEffects } from "@/hooks/use-landing-effects";
import { useLandingScroll } from "@/hooks/use-landing-scroll";
import { LANDING_ROUTES } from "@/lib/landing-routes";
import { LANDING_NAV_LINKS } from "@/lib/landing-nav";
import { BOUTIQUE_PRODUCTS } from "@/lib/boutique-products";
import { TRADE_PROFILES } from "@/lib/trade-profiles";
import { HOW_IT_WORKS_STEPS } from "@/lib/how-it-works-steps";
import { LandingTrackMapLazy } from "@/components/maps/landing-track-map-lazy";

const ARROW_RED = (
  <svg viewBox="0 0 24 24" fill="none" stroke="#e0231c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const ARROW_BLUE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="#1e73be" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const BRAND_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z" />
  </svg>
);

const STAR = (
  <svg viewBox="0 0 24 24">
    <path d="m12 2 3 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17l-6.3 3.3 1.6-6.8L2 8.9l6.9-.6z" />
  </svg>
);

function CtaLink({
  href,
  className = "",
  children,
  blue = false,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  blue?: boolean;
}) {
  return (
    <Link href={href} className={`cta ${blue ? "blue" : ""} ${className}`.trim()}>
      <span className="arrow" aria-hidden="true">{blue ? ARROW_BLUE : ARROW_RED}</span>
      {children}
    </Link>
  );
}

/** Bloc CTA : S'inscrire (primaire) + Se connecter (secondaire) */
function CtaAuthBlock({
  signupHref,
  loginHref,
  blue = false,
  centered = false,
}: {
  signupHref: string;
  loginHref: string;
  blue?: boolean;
  centered?: boolean;
}) {
  return (
    <div className={`cta-auth-block ${centered ? "centered" : ""}`}>
      <CtaLink href={signupHref} blue={blue}>S&apos;inscrire</CtaLink>
      <Link href={loginHref} className="cta-login-link">
        Déjà inscrit ? <b>Se connecter</b>
      </Link>
    </div>
  );
}

/** Landing page — conversion exacte de depannage-express-landing.html */
export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrolled } = useLandingScroll({ heroRef, heroCopyRef, figureRef });
  useLandingEffects(rootRef);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    if (menuOpen) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [menuOpen]);

  return (
    <div className="landing-root" ref={rootRef}>
      <header className={`nav-shell${scrolled ? " is-scrolled" : ""}`}>
        <nav className="nav" aria-label="Navigation principale">
          <Link href="/" className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <Image src="/logo-mark.png" alt="" width={80} height={80} priority />
            </span>
            <span className="brand-name">Dépannage Express</span>
          </Link>

          <ul className="nav-links">
            {LANDING_NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="nav-link-item">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <Link href={LANDING_ROUTES.clientSignup} className="nav-cta">
              S&apos;inscrire
            </Link>
            <div className="nav-wrap">
              <button
                type="button"
                className="nav-menu"
                aria-label="Menu"
                aria-expanded={menuOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((o) => !o);
                }}
              >
                <span /><span /><span />
              </button>
              {menuOpen && (
                <div className="nav-panel" onClick={(e) => e.stopPropagation()}>
                  {LANDING_NAV_LINKS.map((link) => (
                    <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                      {link.label}
                    </a>
                  ))}
                  <a href="#pro" onClick={() => setMenuOpen(false)}>Devenir dépanneur</a>
                  <div className="nav-panel-divider" />
                  <p className="nav-panel-label">Conducteur</p>
                  <Link href={LANDING_ROUTES.clientSignup} onClick={() => setMenuOpen(false)}>S&apos;inscrire</Link>
                  <Link href={LANDING_ROUTES.clientLogin} onClick={() => setMenuOpen(false)}>Se connecter</Link>
                  <div className="nav-panel-divider" />
                  <p className="nav-panel-label">Dépanneur</p>
                  <Link href={LANDING_ROUTES.proSignup} onClick={() => setMenuOpen(false)}>S&apos;inscrire</Link>
                  <Link href={LANDING_ROUTES.proLogin} onClick={() => setMenuOpen(false)}>Se connecter</Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <div className="hero-ambient" aria-hidden="true">
          <span className="orb orb-a" />
          <span className="orb orb-b" />
          <span className="orb orb-c" />
        </div>

        <div className="hero-inner">
          <div className="hero-copy" ref={heroCopyRef}>
            <div className="badge"><span className="dot" /> Disponible 24 h/24</div>
            <h1 className="headline">
              <span className="line"><span>En panne ?</span></span>
              <span className="line"><span>Le dépanneur</span></span>
              <span className="line"><span>est déjà en route.</span></span>
            </h1>
            <p className="hero-lead">
              Mécanicien, vulcanisateur ou électricien automobile —{" "}
              <strong>Dépannage Express</strong> vous connecte au professionnel le plus proche.
              Suivez-le en direct jusqu&apos;à son arrivée.
            </p>
            <CtaAuthBlock
              signupHref={LANDING_ROUTES.clientSignup}
              loginHref={LANDING_ROUTES.clientLogin}
            />
          </div>

          <div className="figure-wrap" ref={figureRef}>
            <div className="figure-inner">
              <Image
                id="hero-photo"
                src="/hero-mecano.png"
                alt="Mécanicien Dépannage Express"
                fill
                priority
                sizes="(max-width: 860px) 88vw, 42vw"
                className="object-contain object-bottom"
              />
            </div>
          </div>
        </div>

        <div className="giant" aria-hidden="true">DÉPANNAGE</div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="section section-alt" id="comment">
        <div className="wrap">
          <div className="steps-head reveal">
            <div>
              <span className="eyebrow">Comment ça marche</span>
              <h2 className="sec-title">Dépanné en <span className="em">trois étapes.</span></h2>
            </div>
            <p>Pas d&apos;attente interminable au bord de la route. Vous signalez, le dépanneur arrive, vous suivez tout en direct.</p>
          </div>
          <div className="steps">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <article key={item.slug} className="step reveal">
                <div className="step-visual">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={960}
                    height={540}
                    sizes="(max-width: 980px) 50vw, 33vw"
                  />
                  <span className="num">{item.step}</span>
                </div>
                <div className="step-body">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MÉTIERS */}
      <section className="section" id="metiers" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="reveal">
            <span className="eyebrow">Nos pros</span>
            <h2 className="sec-title">Un expert pour <span className="em">chaque panne.</span></h2>
          </div>
          <div className="trades">
            {TRADE_PROFILES.map((trade) => (
              <article key={trade.slug} className={`trade ${trade.accent} reveal`}>
                <div className="trade-visual">
                  <Image
                    src={trade.imageUrl}
                    alt={trade.title}
                    width={960}
                    height={540}
                    sizes="(max-width: 980px) 50vw, 33vw"
                  />
                </div>
                <div className="trade-body">
                  <h3>{trade.title}</h3>
                  <p>{trade.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SUIVI */}
      <section className="section" id="suivi" style={{ paddingTop: 0 }}>
        <div className="wrap live">
          <div className="live-text reveal">
            <span className="eyebrow">Suivi en direct</span>
            <h2 className="sec-title">Vous voyez votre dépanneur <span className="em">arriver.</span></h2>
            <p>Comme pour une course, suivez la position de votre dépanneur sur la carte, minute par minute, jusqu&apos;à ce qu&apos;il soit à vos côtés.</p>
            <ul className="live-list">
              <li><span className="chk"><svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span> Position et heure d&apos;arrivée mises à jour en direct</li>
              <li><span className="chk"><svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span> Appel direct ou WhatsApp en un seul clic</li>
              <li><span className="chk"><svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span> Notez l&apos;intervention une fois terminée</li>
            </ul>
            <CtaAuthBlock
              signupHref={LANDING_ROUTES.clientSignup}
              loginHref={LANDING_ROUTES.clientLogin}
              blue
            />
          </div>
          <div className="map-float reveal">
            <div className="map-card">
              <div className="map-status">
                <span className="map-live-dot" />
                Suivi en direct
                <span className="map-status-eta">4 min</span>
              </div>
              <LandingTrackMapLazy />
              <div className="map-vignette" aria-hidden="true" />
              <div className="eta-chip">
              <span className="av">{BRAND_SVG}</span>
              <div className="meta"><strong>Koffi, mécanicien</strong><span>★ 4,9 · à 1,2 km</span></div>
              <div className="mini-actions">
                <Link href={LANDING_ROUTES.clientSignup} aria-label="S'inscrire pour appeler"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 1.7 2Z" /></svg></Link>
                <Link href={LANDING_ROUTES.clientSignup} className="wa" aria-label="S'inscrire pour WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.1 7.6L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5Z" /></svg></Link>
              </div>
              <div className="eta">4 min</div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* DÉPANNEURS */}
      <section className="section" id="pro" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="pro-band reveal">
            <div className="pro-grid">
              <div>
                <span className="eyebrow">Vous êtes dépanneur ?</span>
                <h2>Plus de clients. <span className="em">Moins d&apos;attente.</span></h2>
                <p>Recevez des missions près de chez vous, laissez le GPS vous guider, et regardez votre portefeuille se remplir. La commission est prélevée automatiquement, le reste vous revient.</p>
                <CtaAuthBlock
                  signupHref={LANDING_ROUTES.proSignup}
                  loginHref={LANDING_ROUTES.proLogin}
                />
              </div>
              <div className="pro-stats">
                <div className="pro-stat"><span className="ps-ico"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" /></svg></span><div><strong>Missions instantanées</strong><span>Alertes des pannes proches, en temps réel</span></div></div>
                <div className="pro-stat"><span className="ps-ico"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg></span><div><strong>Guidage GPS</strong><span>Conduit directement jusqu&apos;au client</span></div></div>
                <div className="pro-stat"><span className="ps-ico"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg></span><div><strong>Portefeuille intégré</strong><span>Gains suivis, paiements simplifiés</span></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOUTIQUE */}
      <section className="section" id="boutique" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="reveal">
            <span className="eyebrow">La boutique</span>
            <h2 className="sec-title">Pneus, pièces et <span className="em">accessoires.</span></h2>
          </div>
          <div className="shop-grid">
            {BOUTIQUE_PRODUCTS.map((item) => (
              <Link
                key={item.slug}
                href={LANDING_ROUTES.clientSignup}
                className="product reveal"
              >
                <div className="ph">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={480}
                    height={480}
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="info">
                  <span className="cat">{item.categoryLabel}</span>
                  <h4>{item.name}</h4>
                  <div className="price">
                    {item.price.toLocaleString("fr-FR")} F{" "}
                    <em>/ {item.priceUnit}</em>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS + AVIS */}
      <section className="section section-alt" id="avis" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="stats">
            <div className="stat reveal"><div className="val" data-target="2400" data-suffix="+">0</div><div className="lbl">Interventions réussies</div></div>
            <div className="stat reveal"><div className="val" data-target="350" data-suffix="+">0</div><div className="lbl">Dépanneurs vérifiés</div></div>
            <div className="stat reveal"><div className="val" data-target="40" data-suffix="">0</div><div className="lbl">Arrondissements couverts</div></div>
            <div className="stat reveal"><div className="val" data-target="49" data-decimal="true" data-suffix="">0</div><div className="lbl">Note moyenne / 5</div></div>
          </div>
          <div className="reveal" style={{ marginBottom: 40 }}>
            <span className="eyebrow">Ils nous font confiance</span>
            <h2 className="sec-title">La route, l&apos;esprit <span className="em">tranquille.</span></h2>
          </div>
          <div className="reviews">
            <article className="review reveal">
              <div className="stars">{STAR}{STAR}{STAR}{STAR}{STAR}</div>
              <p>« Pneu crevé à 22h sur la route de Calavi. Un vulcanisateur était là en moins de 15 minutes. Bluffant. »</p>
              <div className="who"><span className="av2">A</span><div><strong>Aïcha D.</strong><span>Cotonou</span></div></div>
            </article>
            <article className="review reveal">
              <div className="stars">{STAR}{STAR}{STAR}{STAR}{STAR}</div>
              <p>« Je voyais le dépanneur avancer sur la carte. Plus de stress à attendre sans savoir. Le chat vocal a tout simplifié. »</p>
              <div className="who"><span className="av2">S</span><div><strong>Serge K.</strong><span>Abomey-Calavi</span></div></div>
            </article>
            <article className="review reveal">
              <div className="stars">{STAR}{STAR}{STAR}{STAR}{STAR}</div>
              <p>« Comme dépanneur, je reçois des missions chaque jour près de mon atelier. Mon portefeuille parle de lui-même. »</p>
              <div className="who"><span className="av2">K</span><div><strong>Koffi A.</strong><span>Électricien auto, Porto-Novo</span></div></div>
            </article>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="final reveal">
            <h2>Prêt à reprendre <span className="em">la route ?</span></h2>
            <p>Le dépanneur le plus proche n&apos;est qu&apos;à quelques clics. Disponible jour et nuit, partout au Bénin.</p>
            <CtaAuthBlock
              signupHref={LANDING_ROUTES.clientSignup}
              loginHref={LANDING_ROUTES.clientLogin}
              centered
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <div className="fb-row">
                <Link href="/" className="brand-lockup">
                  <span className="brand-mark" aria-hidden="true">
                    <Image src="/logo-mark.png" alt="" width={80} height={80} />
                  </span>
                  <span className="brand-name">Dépannage Express</span>
                </Link>
              </div>
              <p>L&apos;assistance routière rapide et fiable, 24 h/24. Le bon professionnel, au bon endroit, en quelques minutes.</p>
              <div className="socials">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg></a>
                <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.1 7.6L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5Z" /></svg></a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg></a>
              </div>
            </div>
            <div className="foot-col">
              <h5>Plateforme</h5>
              <a href="#comment">Comment ça marche</a>
              <a href="#metiers">Nos métiers</a>
              <a href="#suivi">Suivi en direct</a>
              <a href="#boutique">Boutique</a>
            </div>
            <div className="foot-col">
              <h5>Conducteur</h5>
              <Link href={LANDING_ROUTES.clientSignup}>S&apos;inscrire</Link>
              <Link href={LANDING_ROUTES.clientLogin}>Se connecter</Link>
            </div>
            <div className="foot-col">
              <h5>Dépanneur</h5>
              <Link href={LANDING_ROUTES.proSignup}>S&apos;inscrire</Link>
              <Link href={LANDING_ROUTES.proLogin}>Se connecter</Link>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© {new Date().getFullYear()} Dépannage Express — Tous droits réservés.</span>
            <span>Conçu au Bénin 🇧🇯</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
