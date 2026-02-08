import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://studyu.hu'

interface BookingConfirmationEmailProps {
  customerName: string
  bookingDate: string
  timeSlot: string
  totalPrice: number
  extras?: Array<{ name: string; price: number }>
}

export function BookingConfirmationEmail({
  customerName,
  bookingDate,
  timeSlot,
  totalPrice,
  extras = [],
}: BookingConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Foglalása visszaigazolva - StudyU</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={`${siteUrl}/logo.svg`} alt="StudyU" height="32" style={{ height: '32px', width: 'auto' }} />
          </Section>
          <Heading style={h1}>Foglalása visszaigazolva!</Heading>

          <Text style={text}>
            Kedves {customerName}!
          </Text>

          <Text style={text}>
            Köszönjük foglalását! Az alábbiakban találja a foglalás részleteit:
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Dátum:</Text>
            <Text style={detailValue}>{bookingDate}</Text>

            <Text style={detailLabel}>Időpont:</Text>
            <Text style={detailValue}>{timeSlot}</Text>

            {extras.length > 0 && (
              <>
                <Text style={detailLabel}>Kiegészítők:</Text>
                {extras.map((extra, i) => (
                  <Text key={i} style={detailValue}>
                    {extra.name} - {extra.price.toLocaleString('hu-HU')} Ft
                  </Text>
                ))}
              </>
            )}

            <Hr style={hr} />

            <Text style={detailLabel}>Összesen:</Text>
            <Text style={totalText}>{totalPrice.toLocaleString('hu-HU')} Ft</Text>
          </Section>

          <Text style={text}>
            Hamarosan küldünk egy díjbekérőt a fizetéshez.
          </Text>

          <Text style={text}>
            Ha bármilyen kérdése van, kérjük vegye fel velünk a kapcsolatot.
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
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
}

const detailLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 4px',
}

const detailValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 12px',
}

const totalText = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0',
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
