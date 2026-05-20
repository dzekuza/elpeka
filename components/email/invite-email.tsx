import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface InviteEmailProps {
  unitNumber: string
  estateName: string
  inviteUrl: string
}

export function InviteEmail({ unitNumber, estateName, inviteUrl }: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Jūs buvote pakviesti į ELPEKAS portalą</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={logoStyle}>ELPEKAS</Text>
          </Section>

          <Section style={contentStyle}>
            <Heading style={headingStyle}>
              Jūs buvote pakviesti į ELPEKAS portalą
            </Heading>

            <Text style={textStyle}>
              Jums buvo suteikta prieiga prie Jūsų buto{' '}
              <strong>{unitNumber}</strong> informacijos objekto{' '}
              <strong>{estateName}</strong>.
            </Text>

            <Text style={textStyle}>
              Paspauskite žemiau esantį mygtuką, kad nustatytumėte slaptažodį
              ir pradėtumėte naudotis portalu.
            </Text>

            <Section style={buttonSectionStyle}>
              <Button href={inviteUrl} style={buttonStyle}>
                Nustatyti slaptažodį
              </Button>
            </Section>

            <Text style={noteStyle}>
              Jei nesitikėjote gauti šio el. laiško, galite jį ignoruoti.
            </Text>
          </Section>

          <Hr style={hrStyle} />

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>ELPEKAS © 2026</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle = {
  backgroundColor: '#f4f4f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const containerStyle = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  maxWidth: '560px',
  borderRadius: '8px',
  overflow: 'hidden' as const,
}

const headerStyle = {
  backgroundColor: '#1a1a1a',
  padding: '24px 32px',
}

const logoStyle = {
  color: '#b5935a',
  fontSize: '22px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0',
}

const contentStyle = {
  padding: '32px',
}

const headingStyle = {
  color: '#111111',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 16px',
}

const textStyle = {
  color: '#444444',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const buttonSectionStyle = {
  margin: '28px 0',
  textAlign: 'center' as const,
}

const buttonStyle = {
  backgroundColor: '#b5935a',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: '600',
  padding: '14px 28px',
  textDecoration: 'none',
}

const noteStyle = {
  color: '#888888',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
}

const hrStyle = {
  borderColor: '#e4e4e7',
  margin: '0',
}

const footerStyle = {
  padding: '20px 32px',
}

const footerTextStyle = {
  color: '#888888',
  fontSize: '13px',
  margin: '0',
  textAlign: 'center' as const,
}
