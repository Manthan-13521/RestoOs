const API_BASE = "https://graph.facebook.com/v22.0"

function getConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  if (!phoneNumberId || !accessToken) {
    throw new Error("WHATSAPP_MISCONFIG")
  }
  return { phoneNumberId, accessToken }
}

export async function sendWhatsAppMessage(params: { to: string; body: string }): Promise<{ messageId: string }> {
  const { phoneNumberId, accessToken } = getConfig()

  const res = await fetch(`${API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: params.to,
      type: "text",
      text: { body: params.body },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return { messageId: data.messages?.[0]?.id ?? `wamid.mock.${Date.now()}` }
}
