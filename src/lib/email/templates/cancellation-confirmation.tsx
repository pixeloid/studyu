import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface CancellationConfirmationEmailProps {
  customerName: string
  bookingDate: string
  timeSlot: string
  cancellationFee: number
  refundAmount: number
  reason?: string
}

export function CancellationConfirmationEmail({
  customerName,
  bookingDate,
  timeSlot,
  cancellationFee,
  refundAmount,
  reason,
}: CancellationConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Foglalás lemondva - StudyU</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Foglalása lemondva</Heading>

          <Text style={text}>
            Kedves {customerName}!
          </Text>

          <Text style={text}>
            Foglalásának lemondása sikeresen megtörtént.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Eredeti dátum:</Text>
            <Text style={detailValue}>{bookingDate}</Text>

            <Text style={detailLabel}>Időpont:</Text>
            <Text style={detailValue}>{timeSlot}</Text>

            {reason && (
              <>
                <Text style={detailLabel}>Lemondás oka:</Text>
                <Text style={detailValue}>{reason}</Text>
              </>
            )}

            <Hr style={hr} />

            {cancellationFee > 0 && (
              <>
                <Text style={detailLabel}>Lemondási díj:</Text>
                <Text style={feeText}>{cancellationFee.toLocaleString('hu-HU')} Ft</Text>
              </>
            )}

            <Text style={detailLabel}>Visszajáró összeg:</Text>
            <Text style={refundText}>{refundAmount.toLocaleString('hu-HU')} Ft</Text>
          </Section>

          {refundAmount > 0 && (
            <Text style={text}>
              A visszatérítés 3-5 munkanapon belül megérkezik az eredeti fizetési módra.
            </Text>
          )}

          <Text style={text}>
            Reméljük, hamarosan újra látjuk!
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
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
}

const detailLabel = {
  color: '#991b1b',
  fontSize: '14px',
  margin: '0 0 4px',
}

const detailValue = {
  color: '#7f1d1d',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 12px',
}

const feeText = {
  color: '#dc2626',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px',
}

const refundText = {
  color: '#16a34a',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
}
