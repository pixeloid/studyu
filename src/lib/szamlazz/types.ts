export interface InvoiceItem {
  name: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: string // '27', '18', '5', 'AAM', 'TAM', 'EU', 'EUK', 'MAA'
  netPrice: number
  vatAmount: number
  grossPrice: number
}

export interface InvoiceBuyer {
  name: string
  zip: string
  city: string
  address: string
  email?: string
  phone?: string
  taxNumber?: string
  taxNumberEU?: string
}

export interface InvoiceSeller {
  bank?: string
  bankAccountNumber?: string
  emailReplyTo?: string
  emailSubject?: string
  emailText?: string
}

export interface CreateInvoiceParams {
  buyerName: string
  buyerZip: string
  buyerCity: string
  buyerAddress: string
  buyerEmail?: string
  buyerPhone?: string
  buyerTaxNumber?: string
  items: Array<{
    name: string
    quantity: number
    unit: string
    unitPriceNet: number
    vatRate: string
  }>
  paymentMethod: 'cash' | 'transfer' | 'card' | 'szep'
  paymentDeadlineDays?: number
  currency?: string
  language?: string
  comment?: string
  orderNumber?: string
  proforma?: boolean
  proformaNumber?: string
  invoiceIdPrefix?: string
  paid?: boolean
}

export interface SzamlazzResponse {
  success: boolean
  invoiceId?: string
  netPrice?: number
  grossPrice?: number
  customerUrl?: string
  error?: string
}

export interface StornoParams {
  invoiceNumber: string
  eInvoice?: boolean
}
