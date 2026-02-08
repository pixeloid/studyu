import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import type { CreateInvoiceParams, SzamlazzResponse, StornoParams } from './types'

const SZAMLAZZ_URL = 'https://www.szamlazz.hu/szamla/'

interface SzamlazzConfig {
  agentKey: string
  eInvoice?: boolean
  downloadPdf?: boolean
}

function getConfig(): SzamlazzConfig {
  const agentKey = process.env.SZAMLAZZ_AGENT_KEY
  if (!agentKey) {
    throw new Error('SZAMLAZZ_AGENT_KEY environment variable is not set')
  }
  return {
    agentKey,
    eInvoice: process.env.SZAMLAZZ_E_INVOICE === 'true',
    downloadPdf: true,
  }
}

function buildInvoiceXml(params: CreateInvoiceParams, config: SzamlazzConfig): string {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
  })

  const items = params.items.map((item) => {
    const netPrice = item.unitPriceNet * item.quantity
    const vatRate = parseFloat(item.vatRate) || 0
    const vatAmount = Math.round(netPrice * (vatRate / 100))
    const grossPrice = netPrice + vatAmount

    return {
      megnevezes: item.name,
      mennyiseg: item.quantity,
      mennyisegiEgyseg: item.unit,
      nettoEgysegar: item.unitPriceNet,
      afakulcs: item.vatRate,
      nettoErtek: netPrice,
      afaErtek: vatAmount,
      bruttoErtek: grossPrice,
    }
  })

  const xmlObj = {
    xmlszamla: {
      '@_xmlns': 'http://www.szamlazz.hu/xmlszamla',
      '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@_xsi:schemaLocation': 'http://www.szamlazz.hu/xmlszamla https://www.szamlazz.hu/szamla/docs/xsds/agent/xmlszamla.xsd',
      beallitasok: {
        szamlaagentkulcs: config.agentKey,
        eszamla: config.eInvoice ? 'true' : 'false',
        szamlaLetoltes: config.downloadPdf ? 'true' : 'false',
        valaszVerzio: '2',
      },
      fejlec: {
        keltDatum: new Date().toISOString().split('T')[0],
        teljesitesDatum: new Date().toISOString().split('T')[0],
        fizetesiHataridoDatum: new Date(Date.now() + (params.paymentDeadlineDays || 8) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fizmod: params.paymentMethod === 'transfer' ? 'átutalás' :
                params.paymentMethod === 'cash' ? 'készpénz' :
                params.paymentMethod === 'card' ? 'bankkártya' : 'SZÉP kártya',
        penznem: params.currency || 'HUF',
        szamlaNyelve: params.language || 'hu',
        megjegyzes: params.comment || '',
        rendelesSzam: params.orderNumber || '',
        ...(params.proformaNumber ? { dijbekeroSzamlaszam: params.proformaNumber } : {}),
        dijbekero: params.proforma ? 'true' : 'false',
        ...(params.invoiceIdPrefix ? { szamlaszamElotag: params.invoiceIdPrefix } : {}),
        ...(params.paid ? { fizetve: 'true' } : {}),
      },
      elado: {},
      vevo: {
        nev: params.buyerName,
        irsz: params.buyerZip,
        telepules: params.buyerCity,
        cim: params.buyerAddress,
        email: params.buyerEmail || '',
        adoszam: params.buyerTaxNumber || '',
        telefonszam: params.buyerPhone || '',
      },
      tetelek: {
        tetel: items,
      },
    },
  }

  return builder.build(xmlObj)
}

function buildStornoXml(params: StornoParams, config: SzamlazzConfig): string {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
  })

  const xmlObj = {
    xmlszamlast: {
      '@_xmlns': 'http://www.szamlazz.hu/xmlszamlast',
      '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      beallitasok: {
        szamlaagentkulcs: config.agentKey,
        eszamla: params.eInvoice ?? config.eInvoice ? 'true' : 'false',
      },
      fejlec: {
        szamlaszam: params.invoiceNumber,
        keltDatum: new Date().toISOString().split('T')[0],
      },
    },
  }

  return builder.build(xmlObj)
}

function parseResponse(xmlResponse: string): SzamlazzResponse {
  const parser = new XMLParser({
    ignoreAttributes: false,
  })

  const result = parser.parse(xmlResponse)

  const resp = result.xmlszamlavalasz

  // Check for error response
  if (resp?.hibakod && resp.hibakod !== 0) {
    return {
      success: false,
      error: resp.hibauzenet || 'Unknown error',
    }
  }

  // Success response
  if (resp) {
    return {
      success: true,
      invoiceId: resp.szamlaszam,
      netPrice: parseFloat(resp.szamlanetto) || undefined,
      grossPrice: parseFloat(resp.szamlabrutto) || undefined,
      customerUrl: resp.vevoifiokurl || undefined,
    }
  }

  return {
    success: false,
    error: `Invalid response from Számlázz.hu: ${xmlResponse.substring(0, 200)}`,
  }
}

function sendXml(xml: string): Promise<Response> {
  const formData = new FormData()
  const blob = new Blob([xml], { type: 'application/xml' })
  formData.append('action-xmlagentxmlfile', blob, 'request.xml')

  return fetch(SZAMLAZZ_URL, {
    method: 'POST',
    body: formData,
  })
}

export async function createInvoice(params: CreateInvoiceParams): Promise<SzamlazzResponse> {
  try {
    const config = getConfig()
    const xml = buildInvoiceXml(params, config)

    console.log('Számlázz.hu request XML:', xml)

    const response = await sendXml(xml)

    const responseText = await response.text()
    console.log('Számlázz.hu response:', responseText.substring(0, 500))
    return parseResponse(responseText)
  } catch (error) {
    console.error('Failed to create invoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function createProformaInvoice(params: CreateInvoiceParams): Promise<SzamlazzResponse> {
  return createInvoice({ ...params, proforma: true })
}

export async function stornoInvoice(params: StornoParams): Promise<SzamlazzResponse> {
  try {
    const config = getConfig()
    const xml = buildStornoXml(params, config)

    console.log('Számlázz.hu storno request XML:', xml)

    const response = await sendXml(xml)

    const responseText = await response.text()
    console.log('Számlázz.hu storno response:', responseText.substring(0, 500))
    return parseResponse(responseText)
  } catch (error) {
    console.error('Failed to storno invoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
