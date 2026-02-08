import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://studyu.hu'

interface PaymentReceivedEmailProps {
  customerName: string
  bookingDate: string
  timeSlot: string
  totalPrice: number
  invoiceUrl?: string
}

export function PaymentReceivedEmail({
  customerName,
  bookingDate,
  timeSlot,
  totalPrice,
  invoiceUrl,
}: PaymentReceivedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Fizetés megérkezett - StudyU</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={`${siteUrl}/logo.svg`} alt="StudyU" height="32" style={{ height: '32px', width: 'auto' }} />
          </Section>
          <Section style={successBadge}>
            <Text style={successText}>Fizetés sikeres</Text>
          </Section>

          <Heading style={h1}>Köszönjük a fizetést!</Heading>

          <Text style={text}>
            Kedves {customerName}!
          </Text>

          <Text style={text}>
            Fizetése megérkezett. Foglalása véglegesítve lett.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Dátum:</Text>
            <Text style={detailValue}>{bookingDate}</Text>

            <Text style={detailLabel}>Időpont:</Text>
            <Text style={detailValue}>{timeSlot}</Text>

            <Hr style={hr} />

            <Text style={detailLabel}>Fizetett összeg:</Text>
            <Text style={totalText}>{totalPrice.toLocaleString('hu-HU')} Ft</Text>
          </Section>

          {invoiceUrl && (
            <Text style={text}>
              Számláját itt tekintheti meg:{' '}
              <Link href={invoiceUrl} style={link}>
                Számla letöltése
              </Link>
            </Text>
          )}

          <Text style={text}>
            Várjuk Önt a megadott időpontban!
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Üdvözlettel,<br />
            StudyU Csapata
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
}

const successBadge = {
  backgroundColor: '#d1fae5',
  borderRadius: '9999px',
  padding: '8px 16px',
  marginBottom: '20px',
  display: 'inline-block',
}

const successText = {
  color: '#065f46',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 20px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 16px',
}

const detailsBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
}

const detailLabel = {
  color: '#166534',
  fontSize: '14px',
  margin: '0 0 4px',
}

const detailValue = {
  color: '#14532d',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 12px',
}

const totalText = {
  color: '#14532d',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0',
}

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const logoSection = {
  marginBottom: '24px',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
}
