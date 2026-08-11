"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wrench,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { StatCard } from "@/components/ui/stat-card";
import { RatingStars } from "@/components/ui/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";
import { OTPInput } from "@/components/ui/otp-input";
import { toast } from "@/components/ui/toast";
import { staggerContainer, staggerItem } from "@/lib/animations";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <h2 className="font-display text-2xl font-bold mb-1">{title}</h2>
      {description && <p className="text-text-secondary text-sm mb-6">{description}</p>}
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  const [otp, setOtp] = useState("");
  const [rating, setRating] = useState(4);

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-28 pb-20">
        <div className="mb-12">
          <Badge variant="brand" className="mb-4">Design System</Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-3">
            Styleguide
          </h1>
          <p className="text-text-secondary">
            Composants UI de base — Dépannage Express.{" "}
            <Link href="/" className="text-brand-blue hover:underline">
              Retour accueil
            </Link>
          </p>
        </div>

        {/* Palette */}
        <Section title="Palette" description="Variables CSS du design system">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: "bg-base", var: "--bg-base" },
              { name: "bg-surface", var: "--bg-surface" },
              { name: "brand-blue", var: "--brand-blue" },
              { name: "brand-red", var: "--brand-red" },
              { name: "accent-glow", var: "--accent-glow" },
              { name: "success", var: "--success" },
              { name: "warning", var: "--warning" },
              { name: "text-secondary", var: "--text-secondary" },
            ].map((c) => (
              <div key={c.name} className="rounded-card border border-border overflow-hidden">
                <div className="h-16" style={{ background: `var(${c.var})` }} />
                <p className="p-2 text-xs text-text-secondary font-mono">{c.name}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Typographie */}
        <Section title="Typographie">
          <div className="space-y-4 rounded-card border border-border p-6 bg-bg-surface">
            <p className="text-hero font-display">Hero Display</p>
            <p className="font-display text-3xl font-bold">Titre Display</p>
            <p className="text-base">Corps Inter — texte courant lisible.</p>
            <p className="text-sm text-text-secondary">Texte secondaire</p>
          </div>
        </Section>

        {/* Boutons */}
        <Section title="Boutons">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" showArrow>Primaire</Button>
            <Button variant="urgent" showArrow>Urgent</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="glass">Glass</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="primary" loading>Chargement</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg" showArrow>Large</Button>
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="brand">Brand</Badge>
            <Badge variant="urgent">Urgent</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="Champs de saisie">
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="demo-input">E-mail</Label>
              <Input id="demo-input" placeholder="vous@exemple.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-error">Avec erreur</Label>
              <Input id="demo-error" error="Champ requis" defaultValue="" />
            </div>
          </div>
        </Section>

        {/* OTP */}
        <Section title="OTP Input" description="6 cases — codes envoyés par e-mail uniquement">
          <OTPInput value={otp} onChange={setOtp} />
          <p className="mt-2 text-xs text-text-secondary font-mono">Valeur : {otp || "—"}</p>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Intervention #1247</CardTitle>
                <CardDescription>Crevaison — Cotonou, Akpakpa</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="urgent">En cours</Badge>
              </CardContent>
            </Card>
            <Card className="glow-blue">
              <CardHeader>
                <CardTitle>Carte avec glow</CardTitle>
                <CardDescription>Surface elevated avec effet lumineux</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Section>

        {/* StatCards */}
        <Section title="StatCards" description="Count-up animé à l'apparition">
          <motion.div
            className="grid sm:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <StatCard label="Interventions" value={8420} suffix="+" icon={Wrench} trend={{ value: 12, positive: true }} />
            <StatCard label="Dépanneurs" value={156} icon={Users} />
            <StatCard label="Revenus" value={2400000} prefix="" suffix=" FCFA" icon={TrendingUp} />
          </motion.div>
        </Section>

        {/* Avatar */}
        <Section title="Avatar">
          <div className="flex gap-4 items-center">
            <Avatar>
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=depannage" alt="User" />
              <AvatarFallback>DE</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>MK</AvatarFallback>
            </Avatar>
          </div>
        </Section>

        {/* Rating */}
        <Section title="Rating Stars">
          <div className="space-y-3">
            <RatingStars value={rating} onChange={setRating} />
            <RatingStars value={4.5} readonly size="lg" />
          </div>
        </Section>

        {/* Skeleton */}
        <Section title="Skeleton">
          <div className="space-y-3 max-w-md">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full rounded-card" />
          </div>
        </Section>

        {/* Modal & BottomSheet */}
        <Section title="Modal & Bottom Sheet">
          <div className="flex flex-wrap gap-3">
            <Modal>
              <ModalTrigger asChild>
                <Button variant="outline">Ouvrir Modal</Button>
              </ModalTrigger>
              <ModalContent>
                <ModalHeader>
                  <ModalTitle>Confirmer l&apos;annulation</ModalTitle>
                  <ModalDescription>
                    Une pénalité de 500 FCFA sera déduite de votre portefeuille.
                  </ModalDescription>
                </ModalHeader>
                <div className="flex gap-3 mt-4">
                  <Button variant="ghost" className="flex-1">Annuler</Button>
                  <Button variant="urgent" className="flex-1">Confirmer</Button>
                </div>
              </ModalContent>
            </Modal>

            <BottomSheet
              trigger={<Button variant="glass">Bottom Sheet</Button>}
              title="Options d'appel"
              description="Contactez votre dépanneur"
            >
              <div className="space-y-3">
                <Button variant="primary" className="w-full">Appel WhatsApp</Button>
                <Button variant="ghost" className="w-full">Appel téléphonique</Button>
              </div>
            </BottomSheet>
          </div>
        </Section>

        {/* Toasts */}
        <Section title="Toasts">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => toast.success("Intervention acceptée !", { icon: <CheckCircle className="h-4 w-4" /> })}>
              Success
            </Button>
            <Button variant="outline" onClick={() => toast.error("Échec du paiement", { icon: <AlertTriangle className="h-4 w-4" /> })}>
              Error
            </Button>
            <Button variant="outline" onClick={() => toast.info("Dépanneur en route", { icon: <Info className="h-4 w-4" /> })}>
              Info
            </Button>
          </div>
        </Section>

        {/* Glass */}
        <Section title="Glassmorphism">
          <div className="glass rounded-card p-8 text-center">
            <p className="font-display text-xl font-bold">Surface glass</p>
            <p className="text-text-secondary text-sm mt-2">backdrop-blur + fond semi-transparent</p>
          </div>
        </Section>
      </div>
    </>
  );
}
