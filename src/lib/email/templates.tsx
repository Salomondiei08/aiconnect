import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Gabarits transactionnels : sobres, une seule action, couleurs de la charte en dur
 * (les clients de messagerie ignorent les variables CSS).
 */
const c = { ink: "#14213a", muted: "#555e6c", paper: "#f3f2ee", line: "#dcd9d1", teal: "#0b5754" };
const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function Layout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ background: c.paper, fontFamily: font, margin: 0, padding: "24px 0" }}>
        <Container style={{ background: "#ffffff", borderRadius: 12, maxWidth: 560, padding: "32px 28px", border: `1px solid ${c.line}` }}>
          <Text style={{ margin: "0 0 24px", fontSize: 14, fontWeight: 700, color: c.teal, letterSpacing: "0.02em" }}>Comptoir</Text>
          {children}
          <Hr style={{ borderColor: c.line, margin: "28px 0 16px" }} />
          <Text style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: c.muted }}>
            Comptoir, la gestion de votre commerce. E-mail automatique, merci de ne pas y répondre.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const p = { margin: "0 0 16px", fontSize: 15, lineHeight: "24px", color: c.ink } as const;
const h = { margin: "0 0 16px", fontSize: 22, lineHeight: "30px", color: c.ink } as const;
const button = { background: c.ink, color: "#ffffff", borderRadius: 999, padding: "12px 22px", fontSize: 15, fontWeight: 600 } as const;

export function WelcomeEmail({ firstName, company, url }: { firstName: string; company: string; url: string }) {
  return (
    <Layout preview={`Bienvenue ${firstName}, votre espace ${company} est prêt`}>
      <Heading style={h}>Bienvenue, {firstName}</Heading>
      <Text style={p}>Votre espace « {company} » est prêt. Ajoutez vos produits et enregistrez votre première vente en quelques minutes.</Text>
      <Section style={{ margin: "8px 0 16px" }}>
        <Button href={url} style={button}>Ouvrir mon tableau de bord</Button>
      </Section>
    </Layout>
  );
}

export function welcomeText({ firstName, company, url }: { firstName: string; company: string; url: string }): string {
  return `Bienvenue, ${firstName}\n\nVotre espace « ${company} » est prêt.\nOuvrir mon tableau de bord : ${url}\n`;
}

export function PasswordResetEmail({ firstName, url }: { firstName: string; url: string }) {
  return (
    <Layout preview="Choisissez un nouveau mot de passe">
      <Heading style={h}>Réinitialisation du mot de passe</Heading>
      <Text style={p}>Bonjour {firstName}, vous avez demandé à changer votre mot de passe. Ce lien est valable 1 heure et ne sert qu’une fois.</Text>
      <Section style={{ margin: "8px 0 16px" }}>
        <Button href={url} style={button}>Choisir un nouveau mot de passe</Button>
      </Section>
      <Text style={{ ...p, color: c.muted, fontSize: 13 }}>Vous n’êtes pas à l’origine de cette demande ? Ignorez cet e-mail : votre mot de passe reste inchangé.</Text>
    </Layout>
  );
}

export function passwordResetText({ firstName, url }: { firstName: string; url: string }): string {
  return `Bonjour ${firstName},\n\nChoisissez un nouveau mot de passe (lien valable 1 heure, usage unique) :\n${url}\n\nVous n'êtes pas à l'origine de cette demande ? Ignorez cet e-mail.\n`;
}

export function PasswordChangedEmail({ firstName }: { firstName: string }) {
  return (
    <Layout preview="Votre mot de passe a été modifié">
      <Heading style={h}>Mot de passe modifié</Heading>
      <Text style={p}>Bonjour {firstName}, le mot de passe de votre compte vient d’être modifié. Toutes vos sessions ont été fermées.</Text>
      <Text style={{ ...p, color: c.muted, fontSize: 13 }}>Si ce n’était pas vous, contactez immédiatement l’administrateur de votre entreprise.</Text>
    </Layout>
  );
}

export function passwordChangedText({ firstName }: { firstName: string }): string {
  return `Bonjour ${firstName},\n\nLe mot de passe de votre compte vient d'être modifié. Toutes vos sessions ont été fermées.\nSi ce n'était pas vous, contactez immédiatement l'administrateur de votre entreprise.\n`;
}

type InvoiceProps = { company: string; number: string; date: string; total: string };

export function InvoiceEmail({ company, number, date, total }: InvoiceProps) {
  return (
    <Layout preview={`Facture ${number} de ${company}`}>
      <Heading style={h}>Facture {number}</Heading>
      <Text style={p}>Merci pour votre achat chez {company}.</Text>
      <Text style={p}>
        Date : {date}
        <br />
        Montant payé : <strong>{total}</strong>
      </Text>
      <Text style={p}>Votre facture est jointe à cet e-mail au format PDF.</Text>
    </Layout>
  );
}

export function invoiceText({ company, number, date, total }: InvoiceProps): string {
  return `Facture ${number}\n\nMerci pour votre achat chez ${company}.\nDate : ${date}\nMontant payé : ${total}\n\nVotre facture est jointe au format PDF.\n`;
}
