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
import type { DefectStatus } from '@/lib/types'

interface DefectStatusEmailProps {
  defectTitle: string
  newStatus: DefectStatus
  adminMessage?: string
  portalUrl: string
  ownerEmail: string
}

const STATUS_LABELS: Record<DefectStatus, string> = {
  pateikta: 'Pateikta',
  sprendziama: 'Sprendžiama',
  atlikta: 'Atlikta',
}

const STATUS_COLORS: Record<DefectStatus, string> = {
  pateikta: '#6b7280',
  sprendziama: '#d97706',
  atlikta: '#16a34a',
}

export function DefectStatusEmail({
  defectTitle,
  newStatus,
  adminMessage,
  portalUrl,
}: DefectStatusEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Jūsų defekto statusas atnaujintas — {STATUS_LABELS[newStatus]}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={logoStyle}>ELPEKAS</Text>
          </Section>

          <Section style={contentStyle}>
            <Heading style={headingStyle}>
              Jūsų defekto statusas atnaujintas
            </Heading>

            <Text style={labelStyle}>Defektas</Text>
            <Text style={defectTitleStyle}>{defectTitle}</Text>

            <Text style={labelStyle}>Naujas statusas</Text>
            <Section style={badgeSectionStyle}>
              <Text
                style={{
                  ...badgeStyle,
                  backgroundColor: STATUS_COLORS[newStatus],
                }}
              >
                {STATUS_LABELS[newStatus]}
              </Text>
            </Section>

            {adminMessage && (
              <>
                <Text style={labelStyle}>Administratoriaus žinutė</Text>
                <Section style={messageBlockStyle}>
                  <Text style={messageTextStyle}>{adminMessage}</Text>
                </Section>
              </>
            )}

            <Section style={buttonSectionStyle}>
              <Button href={portalUrl} style={buttonStyle}>
                Peržiūrėti defektą
              </Button>
            </Section>
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
  margin: '0 0 24px',
}

const labelStyle = {
  color: '#888888',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  margin: '0 0 6px',
  textTransform: 'uppercase' as const,
}

const defectTitleStyle = {
  color: '#111111',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 20px',
}

const badgeSectionStyle = {
  margin: '0 0 20px',
}

const badgeStyle = {
  borderRadius: '4px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0',
  padding: '4px 12px',
}

const messageBlockStyle = {
  backgroundColor: '#f9f9f9',
  borderLeft: '3px solid #b5935a',
  borderRadius: '4px',
  margin: '0 0 24px',
  padding: '12px 16px',
}

const messageTextStyle = {
  color: '#444444',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const buttonSectionStyle = {
  margin: '28px 0 0',
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
