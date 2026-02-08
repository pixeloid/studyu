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

interface BookingReminderEmailProps {
  customerName: string
  bookingDate: string
  timeSlot: string
  studioAddress: string
}

export function BookingReminderEmail({
  customerName,
  bookingDate,
  timeSlot,
  studioAddress,
}: BookingReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Emlékeztető: holnapi foglalás - StudyU</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Emlékeztető a holnapi foglalásáról</Heading>

          <Text style={text}>
            Kedves {customerName}!
          </Text>

          <Text style={text}>
            Szeretnénk emlékeztetni, hogy holnap foglalása van a StudyU stúdióban.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Dátum:</Text>
            <Text style={detailValue}>{bookingDate}</Text>

            <Text style={detailLabel}>Időpont:</Text>
            <Text style={detailValue}>{timeSlot}</Text>

            <Text style={detailLabel}>Helyszín:</Text>
            <Text style={detailValue}>{studioAddress}</Text>
          </Section>

          <Text style={text}>
            Kérjük, érkezzen időben! Ha bármilyen változás történt, kérjük jelezze felénk.
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
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
}

const detailLabel = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0 0 4px',
}

const detailValue = {
  color: '#78350f',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 12px',
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
